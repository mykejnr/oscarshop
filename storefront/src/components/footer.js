import { /*useDispatch,*/ useSelector } from "react-redux"
import { Link } from "react-router-dom";
import { CgFacebook } from 'react-icons/cg';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';


const FooterLink = ({url, text}) => (
  <Link to={url} className="block mt-2 text-sm hover:text-accent-500">{text}</Link>
)


const SectionHeading = ({heading}) => (
  <div className="font-semibold mb-4">{heading}</div>
)


const SiteLinks = () => {
  const global_state = useSelector(state => state.global)
  const {product_types, categories} = global_state;

  return (
    <div className="flex justify-between gap-20 shrink-0">
      <div>
        <SectionHeading heading="Product" />
        {product_types.map(pt => <FooterLink key={pt.id} url="/catalogue" text={pt.name} /> )}
      </div>
      <div>
        <SectionHeading heading="Categories" />
        {categories.map(ct => <FooterLink key={ct.id} url="/catalogue" text={ct.name} /> )}
      </div>
      <div>
        <SectionHeading heading="Links" />
        <FooterLink url="" text="Contact Us" />
        <FooterLink url="" text="About Us" />
        <FooterLink url="" text="Privacy Policy" />
        <FooterLink url="" text="Terms of Use" />
      </div>
    </div>
  );
}


const SubscribeForm = () => (
  <div>
    <div className="mb-4">Always be informed about new arrivals and product updates.</div>
    <form className="border border-gray-300 rounded relative px-2 border-box">
      <input type="email" placeholder="Email address" className="bg-transparent outline-0 w-full h-8 pr-14" />
      <input type="submit" className="absolute right-0 cursor-pointer text-accent-400 hover:text-accent-600 text-sm font-semibold h-full px-2" />
    </form>
  </div>
)


const SocialMedia = () => (
  <div>
    <div className="mt-8 mb-4">Get in touch and follow us for more updates.</div>
    <div className="flex gap-4">
      <CgFacebook size="20"/>
      <FaInstagram size="20"/>
      <FaWhatsapp size="20"/>
    </div>
  </div>
)


const Footer = () => (
  <footer className="footer border border-gray-300 border-box py-12">
    <div className="max-w-5xl mx-auto flex justify-between">
      <SiteLinks />
      <div>
        <SubscribeForm />
        <SocialMedia />
      </div>
    </div>
  </footer>
)

export default Footer
