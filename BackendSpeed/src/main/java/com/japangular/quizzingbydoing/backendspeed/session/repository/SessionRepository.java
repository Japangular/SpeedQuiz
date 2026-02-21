package com.japangular.quizzingbydoing.backendspeed.session.repository;

import com.japangular.quizzingbydoing.backendspeed.session.model.AppSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;


@Repository
public class SessionRepository {

  private final JdbcTemplate jdbcTemplate;
  private static final Logger logger = LoggerFactory.getLogger(SessionRepository.class);

  @Autowired
  public SessionRepository(@Qualifier("postgresqlJdbcTemplate") JdbcTemplate postgresJdbcTemplate) {
    this.jdbcTemplate = postgresJdbcTemplate;
  }

  /**
   * Creates a new session row. The DB generates the UUID via gen_random_uuid().
   * Returns the generated token.
   */
  public UUID provision(String displayName) {
    String sql = "INSERT INTO app_session (display_name) VALUES (?) RETURNING token";
    UUID token = jdbcTemplate.queryForObject(sql, UUID.class, displayName);
    logger.info("Provisioned session for '{}', token: {}", displayName, token);
    return token;
  }

  /**
   * Looks up a session by token. Also bumps last_seen_at.
   */
  public Optional<AppSession> findByToken(UUID token) {
    try {
      // Bump last_seen_at on every lookup (so we can prune ghosts later)
      jdbcTemplate.update(
          "UPDATE app_session SET last_seen_at = NOW() WHERE token = ?",
          token
      );

      String sql = "SELECT token, display_name, created_at, last_seen_at FROM app_session WHERE token = ?";
      AppSession session = jdbcTemplate.queryForObject(sql, (rs, rowNum) -> mapRow(rs), token);
      return Optional.ofNullable(session);
    } catch (EmptyResultDataAccessException e) {
      return Optional.empty();
    }
  }

  /**
   * Checks if a display name is already taken by another session.
   */
  public boolean isDisplayNameTaken(String displayName) {
    String sql = "SELECT COUNT(*) FROM app_session WHERE LOWER(display_name) = LOWER(?)";
    Integer count = jdbcTemplate.queryForObject(sql, Integer.class, displayName);
    return count != null && count > 0;
  }

  private AppSession mapRow(ResultSet rs) throws SQLException {
    AppSession session = new AppSession();
    session.setToken(UUID.fromString(rs.getString("token")));
    session.setDisplayName(rs.getString("display_name"));
    session.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
    session.setLastSeenAt(rs.getTimestamp("last_seen_at").toLocalDateTime());
    return session;
  }
}
