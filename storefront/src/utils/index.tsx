import moment from "moment";
import { IShippingAddress } from "../typedefs/address";

export const formatPrice = (n: number): string => {
    return (new Intl.NumberFormat('en-gh', { style: 'currency', currency: 'GHS' }).format(n)).toString()
}

export const getCSRFcookie = () => {
    var cookieValue = "",
    name = 'csrftoken';

    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }

    return cookieValue;
};

/**
 * Convert a name (valid variable) to a more approriate version that
 * can be use as label names for inputs
 * @param inputName a name of the input (which may contain understores)
 * @returns 
 */
export const nameToLabel = (inputName: string): string => {
	const names = inputName.split('.')
	// use the last name. eg. 'first_name' in 'shipping.first_name'
	const name = names[names.length - 1] // use the last name g
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  return capitalized.replace('_', " ")
}


export const createRawHtml = (rawHtml: string) => ({
  __html: rawHtml
})


export const strAddress = (address: IShippingAddress) => {
    return address.line4 + ", " + address.line1 + ", " + address.state
}


/**
 * Use moment js to format a date string to the given forat
 * @param dateString a string in a valid datetime format eg. 2022-06-06
 * @param fmtString format string defaults to "Do MMM, YYYY" -> 6 Jun, 2022
 * @returns string
 */
export const fmtDate = (dateString: string, fmtString: string = "Do MMM, YYYY") => {
//TODO lazy import moment.js to enable code splitting
  return moment(dateString).format(fmtString)
}