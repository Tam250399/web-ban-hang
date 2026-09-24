/**
 * Dịch vụ xác thực Đăng nhập Mạng xã hội (Google & Facebook)
 * Hỗ trợ Google Identity Services OAuth2 và Facebook SDK
 */

export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return {}
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return {}
  }
}

export function getGoogleClientId() {
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    localStorage.getItem('GOOGLE_CLIENT_ID') ||
    ''
  ).trim()
}

export function saveGoogleClientId(clientId) {
  if (clientId) {
    localStorage.setItem('GOOGLE_CLIENT_ID', clientId.trim())
  } else {
    localStorage.removeItem('GOOGLE_CLIENT_ID')
  }
}

export function getFacebookAppId() {
  return (
    import.meta.env.VITE_FACEBOOK_APP_ID ||
    localStorage.getItem('FACEBOOK_APP_ID') ||
    ''
  ).trim()
}

export function saveFacebookAppId(appId) {
  if (appId) {
    localStorage.setItem('FACEBOOK_APP_ID', appId.trim())
  } else {
    localStorage.removeItem('FACEBOOK_APP_ID')
  }
}

/**
 * Đăng nhập bằng Google thông qua Google Identity Services (OAuth2 Token Client / One Tap)
 */
export function triggerGoogleSignIn(clientId) {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts) {
      return reject(new Error('Thư viện Google Identity chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng.'))
    }

    if (!clientId) {
      return resolve({ needConfig: true, provider: 'Google' })
    }

    try {
      // Sử dụng Google OAuth2 Token Client mở popup chọn tài khoản Google thật
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error))
          }

          try {
            // Lấy thông tin tài khoản thật từ Google UserInfo API
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            })
            const profile = await res.json()

            resolve({
              provider: 'Google',
              token: tokenResponse.access_token,
              email: profile.email,
              name: profile.name,
              providerKey: profile.sub,
              photoUrl: profile.picture,
            })
          } catch (err) {
            resolve({
              provider: 'Google',
              token: tokenResponse.access_token,
            })
          }
        },
      })

      tokenClient.requestAccessToken({ prompt: 'select_account' })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Đăng nhập bằng Facebook
 */
export function triggerFacebookSignIn(appId) {
  return new Promise((resolve, reject) => {
    if (!appId) {
      return resolve({ needConfig: true, provider: 'Facebook' })
    }

    // Mở popup OAuth trực tiếp của Facebook
    const redirectUri = window.location.origin + window.location.pathname
    const fbOAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(
      appId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email,public_profile`

    const width = 580
    const height = 650
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const popup = window.open(
      fbOAuthUrl,
      'facebook_login_popup',
      `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0`
    )

    if (!popup) {
      return reject(new Error('Trình duyệt đã chặn cửa sổ Popup. Vui lòng cho phép popup để đăng nhập Facebook.'))
    }

    // Lắng nghe token trả về
    const timer = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(timer)
          return
        }

        const url = popup.location?.href || ''
        if (url.includes('access_token=')) {
          clearInterval(timer)
          const hash = popup.location.hash.substring(1)
          const params = new URLSearchParams(hash)
          const accessToken = params.get('access_token')
          popup.close()

          if (accessToken) {
            // Lấy profile từ Facebook Graph API
            fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`)
              .then((r) => r.json())
              .then((fbUser) => {
                resolve({
                  provider: 'Facebook',
                  token: accessToken,
                  email: fbUser.email,
                  name: fbUser.name,
                  providerKey: fbUser.id,
                })
              })
              .catch(() => {
                resolve({ provider: 'Facebook', token: accessToken })
              })
          }
        }
      } catch {
        // Cross-origin url check before redirect completes
      }
    }, 500)
  })
}
