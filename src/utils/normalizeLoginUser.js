export async function normalizeLoginUser({
  apiResponse,
  axios,
  VITE_API,
  saveTokens,
}) {
  // 1. Save tokens
  saveTokens(apiResponse.accessToken, apiResponse.refreshToken);

  // 2. Base user
  const baseUserData = apiResponse.user || apiResponse.data?.user || {};
  let userPayload = {
    ...baseUserData,
    roles: apiResponse.roles || baseUserData.roles || [],
    showDivisions: apiResponse.showDivisions ?? true,
    userDivision: apiResponse.userDivision || null,
  };

  // 3. Fetch /auth/me (CRITICAL)
  try {
    const profileResponse = await axios.get(`${VITE_API}/auth/me`, {
      headers: {
        Authorization: `Bearer ${apiResponse.accessToken}`,
      },
    });

    const profileData = profileResponse.data?.data || profileResponse.data;
    const normalizedProfile = profileData.user || profileData;

    userPayload = {
      ...userPayload,
      ...normalizedProfile,
      roles: normalizedProfile.roles || userPayload.roles,
      showDivisions:
        typeof normalizedProfile.showDivisions === "boolean"
          ? normalizedProfile.showDivisions
          : userPayload.showDivisions,
      requiresStoreSelection:
        profileData.requiresStoreSelection === true ||
        profileData.storeSelectionRequired === true,
      assignedStores: profileData.assignedStores || [],
      defaultStore: profileData.defaultStore || null,
      isStoreManager: profileData.isStoreManager || false,
    };

    // Persist authMeData
    localStorage.setItem(
      "authMeData",
      JSON.stringify({
        requiresStoreSelection: userPayload.requiresStoreSelection,
        assignedStores: userPayload.assignedStores,
        defaultStore: userPayload.defaultStore,
        isStoreManager: userPayload.isStoreManager,
      }),
    );
  } catch (err) {
    console.warn("Login normalize: /auth/me failed", err);
  }

  // 4. Persist user (OTP does this!)
  localStorage.setItem("user", JSON.stringify(userPayload));

  return userPayload;
}
