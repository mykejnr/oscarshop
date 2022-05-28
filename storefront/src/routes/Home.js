import { Link } from "react-router-dom"


function Home() {
    return (
        <div className="Catalog">
            This the Home page
            <p>
                <Link to={"/catalogue"}>This is the link to Catalogues</Link>
            </p>
            <p>
                <Link to={"/reset-password"}>This is the link to ResetPassword</Link>
            </p>
        </div>
    )
}

export default Home
