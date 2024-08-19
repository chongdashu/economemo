export async function getAuthHeaders() {
    console.log("getAuthHeaders()");
    const { userId, userEmail } = await chrome.storage.local.get(["userId", "userEmail"]);
    
    let chromeUserId = null;
    try {
      const userInfo = await new Promise((resolve, reject) => {
        chrome.identity.getProfileUserInfo({ accountStatus: 'SYNC' }, (info) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(info);
          }
        });
      });
      chromeUserId = userInfo.id;
    } catch (error) {
      console.warn("Chrome identity not available:", error);
    }

    console.log("getAuthHeaders() - successfully retrieved auth headers");
  
    return {
      'User-Id': userId,
      'User-Email': userEmail,
      ...(chromeUserId && { 'Chrome-User-Id': chromeUserId })
    };
  }