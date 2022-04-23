import { Link } from "react-router-dom"


function Home() {
    return (
        <div className="Catalog">
            This the Home page
            <Link to={"/catalogue"}>This is the link to Catalogues</Link>
        </div>
    )
}

export default Home
