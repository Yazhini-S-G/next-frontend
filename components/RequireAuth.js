"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, hasPermission } from "@/lib/api";
import Shell from "@/components/Shell";
import PropTypes from "prop-types";

export default function RequireAuth({ permission, children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }
    api("/rbac/me")
      .then((profile) => {
        setUser(profile);
        setState("ready");
      })
      .catch(() => {
        router.push("/");
      });
  }, [router]);

  if (state === "loading") return <div className="center-screen">Loading...</div>;
  if (permission && !hasPermission(user, permission)) {
    return (
      <Shell user={user}>
        <div className="empty-state">Access Denied</div>
      </Shell>
    );
  }

  return <Shell user={user}>{children(user, setUser)}</Shell>;
}

RequireAuth.propTypes = {
  permission: PropTypes.string,
  children: PropTypes.func.isRequired,
};

RequireAuth.defaultProps = {
  permission: undefined,
};
