export const endpoints = {
  auth: {
    login: "/auth/login/",
    logout: "/auth/logout/",
    refresh: "/auth/token/refresh/",
    profile: "/auth/profile/",
  },
  medications: {
    list: "/medications/",
    detail: (id: string) => `/medications/${id}/`,
    adherence: (id: string) => `/medications/${id}/adherence/`,
  },
  pharmacies: { list: "/pharmacies/", detail: (id: string) => `/pharmacies/${id}/` },
  products: { list: "/products/", detail: (id: string) => `/products/${id}/` },
  orders: { list: "/orders/", detail: (id: string) => `/orders/${id}/` },
  conversations: { list: "/conversations/", detail: (id: string) => `/conversations/${id}/` },
  ocr: { extract: "/ocr/extractions/" },
  refills: { list: "/refill-requests/" },
  admin: { verifications: "/admin/verifications/" },
} as const;
