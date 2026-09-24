import { NavLink } from "react-router-dom";
import classes from "./TopNavigationBar.module.css";
const TopNavigationBar = () => {
  return (
    <header className={classes.header}>
      <nav>
        <ul className={classes.list}>
          {/*
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? classes.active : undefined)}
              end
            >
              Home
            </NavLink>
          </li>
          */}
          <li>
            <NavLink
              to="/case"
              className={({ isActive }) => (isActive ? classes.active : undefined)}
            >
              Case
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/evidence"
              className={({ isActive }) => (isActive ? classes.active : undefined)}
            >
              Evidence
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default TopNavigationBar;
