import "next-auth" 
declare module "next-auth" {
 interface session {
   accessToken?: string
  }
} 
