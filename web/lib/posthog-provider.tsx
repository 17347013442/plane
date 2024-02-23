import { FC, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
// mobx store provider
import { IUser, IWorkspace } from "@plane/types";
// constants
import { GROUP_WORKSPACE } from "constants/event-tracker";

export interface IPosthogWrapper {
  children: ReactNode;
  user: IUser | null;
  workspaces: Record<string, IWorkspace>;
  currentWorkspaceId: string | undefined;
  posthogAPIKey: string | null;
  posthogHost: string | null;
}

const PostHogProvider: FC<IPosthogWrapper> = (props) => {
  const { children, user, workspaces, currentWorkspaceId, posthogAPIKey, posthogHost } = props;
  // states
  const [lastWorkspaceId, setLastWorkspaceId] = useState(currentWorkspaceId);
  // router
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Identify sends an event, so you want may want to limit how often you call it
      posthog?.identify(user.email, {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        use_case: user.use_case,
        workspaces: Object.keys(workspaces),
      });
    }
  }, [user, workspaces]);

  useEffect(() => {
    if (posthogAPIKey && posthogHost) {
      posthog.init(posthogAPIKey, {
        api_host: posthogHost || "https://app.posthog.com",
        autocapture: false,
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      });
    }
  }, [posthogAPIKey, posthogHost]);

  useEffect(() => {
    // Join workspace group on workspace change
    if (lastWorkspaceId !== currentWorkspaceId && currentWorkspaceId && user) {
      setLastWorkspaceId(currentWorkspaceId);
      posthog?.identify(user.email);
      posthog?.group(GROUP_WORKSPACE, currentWorkspaceId);
    }
  }, [currentWorkspaceId, lastWorkspaceId, user]);

  useEffect(() => {
    // Track page views
    const handleRouteChange = () => {
      posthog?.capture("$pageview");
    };
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (posthogAPIKey) {
    return <PHProvider client={posthog}>{children}</PHProvider>;
  }
  return <>{children}</>;
};

export default PostHogProvider;
