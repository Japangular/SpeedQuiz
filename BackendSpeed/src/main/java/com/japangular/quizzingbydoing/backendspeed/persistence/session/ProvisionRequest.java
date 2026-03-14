package com.japangular.quizzingbydoing.backendspeed.persistence.session;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProvisionRequest {
  @NotBlank(message = "Display name is required")
  @Size(min = 1, max = 30, message = "Display name must be between 1 and 30 characters")
  private String displayName;
}
