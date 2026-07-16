// Single re-export so the views and modals don't each carry the deep relative
// path to the app's api client. Adjust the path on the right if your lib lives
// elsewhere; everything under this route imports { api, fetchMe, logout } from here.
export { api, fetchMe, logout } from "../../../../lib/api";
