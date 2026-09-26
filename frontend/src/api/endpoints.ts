export const endpoints = {
  auth: {
    login: "/auth/login/",
    register: "/auth/register/",
    logout: "/auth/logout/",
    refresh: "/auth/token/refresh/",
    profile: "/auth/profile/",
    forgotPassword: "/auth/password/forgot/",
    completeOnboarding: "/auth/onboarding/complete/",
  },
  medications: {
    list: "/medications/",
    detail: (id: string) => `/medications/${id}/`,
    adherence: (id: string) => `/medications/${id}/adherence/`,
    ocr: "/medications/ocr/",
  },
  pharmacies: { list: "/pharmacies/", detail: (id: string) => `/pharmacies/${id}/` },
  products: { list: "/products/", detail: (id: string) => `/products/${id}/` },
  orders: {
    list: "/orders/",
    checkout: "/orders/checkout/",
    detail: (id: string) => `/orders/${id}/`,
  },
  preorders: { list: "/pre-order-requests/" },
  conversations: { list: "/conversations/", detail: (id: string) => `/conversations/${id}/` },
  ocr: { extract: "/ocr/extractions/" },
  refills: { list: "/refill-requests/" },
  admin: { verifications: "/admin/verifications/" },
} as const;
