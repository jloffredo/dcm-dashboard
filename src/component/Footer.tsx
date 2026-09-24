import ThemeToggle from "./ThemeToggle.tsx";
import classes from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={classes.footer}>
      <ThemeToggle />
    </footer>
  );
};

export default Footer;
