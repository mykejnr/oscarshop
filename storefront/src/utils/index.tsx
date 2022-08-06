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