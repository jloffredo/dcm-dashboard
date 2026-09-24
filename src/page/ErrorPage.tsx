import {isRouteErrorResponse, useRouteError} from "react-router-dom";
import TopNavigationBar from "../component/TopNavigationBar.tsx";
import PageContent from "../component/PageContent.tsx";

const ErrorPage = () => {
    let message = "Page Not Found";
    const error = useRouteError();
    console.log(error);
    if(isRouteErrorResponse(error) && error.status === 500){
        message = JSON.parse(error.data).message;
    }
    return (
        <>
            <TopNavigationBar/>
            <PageContent title="Error" >
                {message}
            </PageContent>
        </>
    );
};

export default ErrorPage;