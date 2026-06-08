import { useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import GooeyNav from "./GooeyNav.jsx";
import "./Navbar.css";

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials =
    `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() ||
    "U";

  const handleSignOut = () => {
    signOut();
    navigate("/welcome", { replace: true });
  };

  // GooeyNav items — same set of links the old navbar exposed.
  const navItems = useMemo(() => {
    const items = [{ label: "Ask", href: "/ask" }];
    if (isAdmin) {
      items.push(
        { label: "Documents", href: "/admin/documents" },
        { label: "Users", href: "/admin/users" },
      );
    }
    return items;
  }, [isAdmin]);

  // Which item should appear active based on the current URL.
  const activeIndex = useMemo(() => {
    const exactIdx = navItems.findIndex((it) => it.href === location.pathname);
    if (exactIdx !== -1) return exactIdx;
    const prefixIdx = navItems.findIndex(
      (it) => it.href !== "/" && location.pathname.startsWith(it.href),
    );
    return prefixIdx === -1 ? 0 : prefixIdx;
  }, [navItems, location.pathname]);

  const handleItemClick = (item) => {
    if (item?.href) navigate(item.href);
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/ask" className="brand">
          <span className="brand-dot" />
          <span>GriffithAI</span>
          <span className="brand-tag">Handbook&nbsp;Q&amp;A</span>
        </NavLink>

        <div className="nav-links-wrap">
          <GooeyNav
            items={navItems}
            initialActiveIndex={activeIndex}
            onItemClick={handleItemClick}
            particleCount={15}
            particleDistances={[90, 10]}
            particleR={100}
            animationTime={600}
            timeVariance={300}
            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          />
        </div>

        <div className="nav-account">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `nav-account-link ${isActive ? "active" : ""}`
            }
            title="Profile"
          >
            <div className="avatar" aria-hidden>
              {initials}
            </div>
            <div className="nav-account-meta">
              <div className="nav-account-name">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="nav-account-role">
                {isAdmin ? "Administrator" : "Member"}
              </div>
            </div>
          </NavLink>
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
