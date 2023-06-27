import { useCallback, useMemo, useState } from "react";

import { Badge, NavMenu, NavMenuItem } from "@axelor/ui";

import { useMenu } from "@/hooks/use-menu";
import { useTabs } from "@/hooks/use-tabs";
import { useTagsList } from "@/hooks/use-tags";
import { MenuItem, Tag } from "@/services/client/meta.types";
import { legacyClassNames } from "@/styles/legacy";

import { useShortcut } from "@/hooks/use-shortcut";
import { i18n } from "@/services/client/i18n";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { useSidebar } from "./hook";

import { ReactComponent as AppIcon } from "../../assets/axelor-icon.svg";
import { ReactComponent as AppLogo } from "../../assets/axelor.svg";

import { useSession } from "@/hooks/use-session";
import styles from "./nav-drawer.module.scss";

function MenuTag({
  item,
  tag,
  color,
}: {
  item: MenuItem;
  tag: string;
  color?: string;
}) {
  return (
    <Badge data-tag-name={item.name} bg={(color || "secondary") as any}>
      {`${tag}`.toUpperCase()}
    </Badge>
  );
}

function MenuIcon({ icon, color }: { icon: string; color?: string }) {
  return (
    <i
      className={legacyClassNames("fa", icon)}
      style={{ color, fontSize: 16 }}
    />
  );
}

function load(res: MenuItem[], tags: Tag[]) {
  const menus = res.filter((item) => item.left !== false);
  const toNavItemProps = (item: MenuItem): NavMenuItem => {
    const {
      name,
      title,
      action,
      tag,
      tagStyle: tagColor,
      icon,
      iconBackground: iconColor,
    } = item;
    const items = action
      ? undefined
      : menus.filter((x) => x.parent === name).map(toNavItemProps);

    const props: NavMenuItem = {
      id: name,
      title,
      items,
      tagColor,
      iconColor,
    };

    if (icon && !item.parent) {
      props.icon = () => <MenuIcon icon={icon} color={iconColor} />;
    }

    if (tag) {
      props.tag = () => <MenuTag item={item} tag={tag} color={tagColor} />;
    }

    return props;
  };
  return menus.filter((item) => !item.parent).map(toNavItemProps);
}

export function NavDrawer() {
  const { open: openTab } = useTabs();
  const { loading, menus = [] } = useMenu();
  const { mode, show, small, sidebar, setSidebar } = useSidebar();
  const [showSearch, setShowSearch] = useState(false);

  useShortcut({
    key: "F9",
    action: useCallback(() => setSidebar(!sidebar), [setSidebar, sidebar]),
  });

  useShortcut({
    key: "M",
    ctrlKey: true,
    action: useCallback(() => setShowSearch(!showSearch), [showSearch]),
  });

  const handleClick = useCallback(
    async (item: NavMenuItem) => {
      const menu = menus.find((x) => x.name === item.id);
      if (menu?.action) {
        if (small) setSidebar(false);
        await openTab(menu.action, { tab: true });
      }
    },
    [menus, small, setSidebar, openTab]
  );

  const handleSearchShow = useCallback(() => setShowSearch(true), []);
  const handleSearchHide = useCallback(() => setShowSearch(false), []);

  const tags = useTagsList();

  const items = useMemo(() => load(menus, tags), [menus, tags]);

  if (loading) return null;

  return (
    <NavMenu
      mode={mode}
      show={show}
      items={items}
      onItemClick={handleClick}
      searchActive={showSearch}
      searchOptions={{
        title: i18n.get("Search menu..."),
        onShow: handleSearchShow,
        onHide: handleSearchHide,
      }}
      header={<Header />}
      headerSmall={<HeaderSmall />}
    />
  );
}

function Header() {
  const { data } = useSession();
  const { sidebar, setSidebar } = useSidebar();
  const { open: openTab } = useTabs();

  const appHome = data?.user.action;
  const appLogo = data?.app.logo;

  const onLogoClick = useCallback(() => {
    if (appHome) {
      openTab(appHome);
    }
  }, [appHome, openTab]);

  return (
    <div className={styles.header}>
      <div className={styles.toggle} onClick={(e) => setSidebar(!sidebar)}>
        <MaterialIcon className={styles.toggleIcon} icon="menu" />
      </div>
      <div className={styles.appLogo} onClick={onLogoClick}>
        {appLogo ? <img src={appLogo} alt="logo" /> : <AppLogo />}
      </div>
    </div>
  );
}

function HeaderSmall() {
  const { data } = useSession();
  const appIcon = data?.app.icon;
  return (
    <div className={styles.header}>
      <div className={styles.appIcon}>
        {appIcon ? (
          <img src={appIcon} alt="icon" />
        ) : (
          <AppIcon viewBox="0 0 241 228" />
        )}
      </div>
    </div>
  );
}
