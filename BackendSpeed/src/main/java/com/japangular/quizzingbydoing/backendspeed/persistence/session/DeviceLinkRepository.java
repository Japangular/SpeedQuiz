package com.japangular.quizzingbydoing.backendspeed.persistence.session;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * JdbcTemplate rather than JPA, matching SessionRepository and the rest of the
 * raw-SQL side of this codebase.
 */
@Repository
@RequiredArgsConstructor
public class DeviceLinkRepository {

  private static final Logger logger = LoggerFactory.getLogger(DeviceLinkRepository.class);

  private final JdbcTemplate jdbcTemplate;

  /**
   * One live code per owner. Re-issuing invalidates the previous one, so a code
   * read aloud and then abandoned cannot be used ten minutes later.
   */
  public void replaceForOwner(String codeHash, UUID ownerId, LocalDateTime expiresAt) {
    jdbcTemplate.update("DELETE FROM device_link_code WHERE owner_id = ?", ownerId);
    jdbcTemplate.update(
        "INSERT INTO device_link_code (code_hash, owner_id, expires_at) VALUES (?, ?, ?)",
        codeHash, ownerId, Timestamp.valueOf(expiresAt));
  }

  public Optional<DeviceLinkCode> findByHash(String codeHash) {
    try {
      String sql = """
          SELECT code_hash, owner_id, created_at, expires_at, attempts, consumed_at
          FROM device_link_code
          WHERE code_hash = ?
          """;
      return Optional.ofNullable(jdbcTemplate.queryForObject(sql, (rs, n) -> mapRow(rs), codeHash));
    } catch (EmptyResultDataAccessException e) {
      return Optional.empty();
    }
  }

  /**
   * Consumes the code and returns true only if this call is the one that did
   * it. The WHERE clause re-checks every precondition, so two devices racing
   * on the same code produce exactly one winner without an explicit lock.
   */
  public boolean consume(String codeHash, int maxAttempts) {
    int updated = jdbcTemplate.update("""
        UPDATE device_link_code
        SET consumed_at = NOW()
        WHERE code_hash = ?
          AND consumed_at IS NULL
          AND expires_at > NOW()
          AND attempts < ?
        """, codeHash, maxAttempts);
    return updated == 1;
  }

  public void recordFailedAttempt(String codeHash) {
    jdbcTemplate.update(
        "UPDATE device_link_code SET attempts = attempts + 1 WHERE code_hash = ?", codeHash);
  }

  /** Called opportunistically on issue; no scheduler needed for this volume. */
  public int pruneExpired() {
    int removed = jdbcTemplate.update(
        "DELETE FROM device_link_code WHERE expires_at < NOW() - INTERVAL '1 hour'");
    if (removed > 0) {
      logger.debug("Pruned {} expired device link codes", removed);
    }
    return removed;
  }

  private DeviceLinkCode mapRow(ResultSet rs) throws SQLException {
    DeviceLinkCode code = new DeviceLinkCode();
    code.setCodeHash(rs.getString("code_hash"));
    code.setOwnerId((UUID) rs.getObject("owner_id"));
    code.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
    code.setExpiresAt(rs.getTimestamp("expires_at").toLocalDateTime());
    code.setAttempts(rs.getInt("attempts"));
    Timestamp consumed = rs.getTimestamp("consumed_at");
    code.setConsumedAt(consumed == null ? null : consumed.toLocalDateTime());
    return code;
  }
}
