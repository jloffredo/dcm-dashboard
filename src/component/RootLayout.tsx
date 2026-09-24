import TopNavigationBar from "./TopNavigationBar.tsx";
import Footer from "./Footer.tsx";
import { Outlet, useLocation, useNavigation } from "react-router-dom";
import classes from "./RootLayout.module.css";

const RootLayout = () => {
  const navigation = useNavigation();
  const location = useLocation();

  return (
    <>
      <TopNavigationBar />
      <main>
        {navigation.state==='loading' && <p style={{textAlign: 'center'}}>Loading...</p>}
        <div key={location.pathname} className={classes.page}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default RootLayout;
