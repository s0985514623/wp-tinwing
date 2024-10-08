// import { AuthBindings } from '@refinedev/core';

// // import { supabaseClient, needAuth } from './utils';

// const authProvider: AuthBindings = {
//     login: async ({ email, password, providerName }) => {
//         // sign in with oauth

//         try {
//             if (providerName === 'google') {
//                 const { data, error } = await supabaseClient.auth.signInWithOAuth({
//                     provider: providerName,
//                 });

//                 if (error) {
//                     return {
//                         success: false,
//                         error,
//                     };
//                 }

//                 if (data?.url || !needAuth) {
//                     return {
//                         success: true,
//                         redirectTo: '/',
//                     };
//                 }
//             }

//             // sign in with email and password
//             if (providerName === 'email') {
//                 const { data, error } = await supabaseClient.auth.signInWithPassword({
//                     email,
//                     password,
//                 });

//                 if (error) {
//                     return {
//                         success: false,
//                         error,
//                     };
//                 }

//                 if (data?.user) {
//                     return {
//                         success: true,
//                         redirectTo: '/',
//                     };
//                 }
//             }
//         } catch (error: any) {
//             return {
//                 success: false,
//                 error,
//             };
//         }

//         return {
//             success: false,
//             error: new Error('Login failed'),
//         };
//     },
//     register: async ({ email, password }) => {
//         try {
//             const { data, error } = await supabaseClient.auth.signUp({
//                 email,
//                 password,
//             });

//             if (error) {
//                 return {
//                     success: false,
//                     error,
//                 };
//             }

//             if (data) {
//                 return {
//                     success: true,
//                     redirectTo: '/',
//                 };
//             }
//         } catch (error: any) {
//             return {
//                 success: false,
//                 error,
//             };
//         }

//         return {
//             success: false,
//             error: new Error('Register failed'),
//         };
//     },
//     forgotPassword: async ({ email }) => {
//         try {
//             const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
//                 redirectTo: `${window.location.origin}/update-password`,
//             });

//             if (error) {
//                 return {
//                     success: false,
//                     error,
//                 };
//             }

//             if (data) {
//                 return {
//                     success: true,
//                 };
//             }
//         } catch (error: any) {
//             return {
//                 success: false,
//                 error,
//             };
//         }

//         return {
//             success: false,
//             error: new Error('Forgot Password password failed'),
//         };
//     },
//     updatePassword: async ({ password }) => {
//         try {
//             const { data, error } = await supabaseClient.auth.updateUser({
//                 password,
//             });

//             if (error) {
//                 return {
//                     success: false,
//                     error,
//                 };
//             }

//             if (data) {
//                 return {
//                     success: true,
//                     redirectTo: '/',
//                 };
//             }
//         } catch (error: any) {
//             return {
//                 success: false,
//                 error,
//             };
//         }
//         return {
//             success: false,
//             error: new Error('Update Password password failed'),
//         };
//     },
//     logout: async () => {
//         const { error } = await supabaseClient.auth.signOut();
//         localStorage.clear();
//         sessionStorage.clear();

//         if (error) {
//             return {
//                 success: false,
//                 error,
//             };
//         }

//         return {
//             success: true,
//             redirectTo: '/',
//         };
//     },
//     onError: async (error) => {
//         console.error(error);
//         return { error };
//     },
//     check: async () => {
//         if (!needAuth) return { authenticated: true };

//         try {
//             const { data } = await supabaseClient.auth.getSession();
//             const { session } = data;

//             if (!session) {
//                 return {
//                     authenticated: false,
//                     error: new Error('Not authenticated'),
//                     logout: true,
//                     redirectTo: '/login',
//                 };
//             }
//         } catch (error: any) {
//             return {
//                 authenticated: false,
//                 error: error || new Error('Not authenticated'),
//                 logout: true,
//                 redirectTo: '/login',
//             };
//         }

//         return {
//             authenticated: true,
//         };
//     },
//     getPermissions: async () => {
//         const user = await supabaseClient.auth.getUser();

//         if (user) {
//             return user.data.user?.role;
//         }

//         return null;
//     },
//     getIdentity: async () => {
//         const { data } = await supabaseClient.auth.getUser();

//         if (data?.user) {
//             return {
//                 ...data.user,
//                 name: data.user.email,
//             };
//         }

//         return null;
//     },
// };

// export default authProvider;
