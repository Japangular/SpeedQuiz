package com.japangular.quizzingbydoing.backendspeed.persistence.session;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClaimCodeRequest {
  @NotBlank(message = "Code is required")
  @Size(min = 6, max = 16, message = "Code must be between 6 and 16 characters")
  private String code;
}