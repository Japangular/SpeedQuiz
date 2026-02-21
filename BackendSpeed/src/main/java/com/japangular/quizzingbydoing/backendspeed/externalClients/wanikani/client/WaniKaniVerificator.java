package com.japangular.quizzingbydoing.backendspeed.externalClients.wanikani.client;

import com.japangular.quizzingbydoing.backendspeed.externalClients.wanikani.client.models.WaniKaniUserResponse;
import com.japangular.quizzingbydoing.backendspeed.externalClients.wanikani.client.models.WaniKaniVerificationStatus;

public class WaniKaniVerificator {
  public static WaniKaniVerificationStatus verifyUser(WaniKaniUserResponse user, String claimedName) {
    if (user == null) {
      return WaniKaniVerificationStatus.USER_WAS_NULL;
    } else if (claimedName == null || !user.data.getUsername().toLowerCase().trim().equals(claimedName.toLowerCase().trim())) {
      return WaniKaniVerificationStatus.CLAIMED_NAME_MISMATCH;
    } else if (!user.data.getSubscription().getType().equals("lifetime")) {
      return WaniKaniVerificationStatus.NOT_LIFETIME;
    } else if (user.data.getSubscription().getMaxLevelGranted() != 60) {
      return WaniKaniVerificationStatus.NOT_MAX_LEVEL;
    } else if (user.data.getSubscription().getPeriodEndsAt() != null) {
      return WaniKaniVerificationStatus.LIMITED_SUBSCRIPTION;
    } else {
      return WaniKaniVerificationStatus.USER_ACCEPTED;
    }
  }
}
