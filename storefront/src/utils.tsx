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



// export const makeRequest = (url: string, opts?: RequestInit) => {
//     const options = {
//         method: 'POST',
//     }
//     return fetch(url, opts)
// }

type FetchErrorArgs = {
    isServerError: boolean,
    status?: number,
    cause?: Error,
    response?: Response
}


const makeRequest = (method: string) => (url:string, options?: RequestInit) => {
    const defaultOpts: RequestInit = {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            "X-CSRFToken": getCSRFcookie(),
        }
    }

    const argOpts = options || {}

    // return fetch(url, { ...options, method })
    return fetch(url, { ...defaultOpts, ...argOpts })

}


export const customGet = makeRequest("GET")
export const customPost = makeRequest("POST")