import type { NextRouter } from "next/router";

export const protectedLandingPaths = ["/cases", "/jobs", "/webinars", "/leaderboard", "/about"];

export const hasAuthToken = () =>
  typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

export const getLoginHref = (redirectPath: string) =>
  `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;

export const getCurrentRedirectPath = () => {
  if (typeof window === "undefined") return "/dashboard";

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const getSafeRedirectPath = (redirect: string | string[] | undefined) => {
  const redirectPath = Array.isArray(redirect) ? redirect[0] : redirect;

  if (
    redirectPath &&
    redirectPath.startsWith("/") &&
    !redirectPath.startsWith("//") &&
    !redirectPath.includes("://")
  ) {
    return redirectPath;
  }

  return "/dashboard";
};

export const redirectToLogin = (router: NextRouter, redirectPath = getCurrentRedirectPath()) => {
  router.replace(getLoginHref(redirectPath));
};
