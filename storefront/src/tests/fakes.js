
export const fakeProducts = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      url: "path/to/product/details",
      id: 1,
      title: "Product 1",
      rating: null,
      price: 233.32,
      availability: true,
      is_parent: false,
      image: "path/to/image/url"
    },
    {
      url: "path/to/product/details",
      id: 2,
      title: "Product 1",
      rating: null,
      price: 233.32,
      availability: true,
      is_parent: false,
      image: "path/to/image/url"
    },
  ]
}


export const fakeAddToCartResponse = {
  'url': '/path/to/basket/',
  'id': 12,
  'status': 'OPEN',
  'total_price': 323.34,
  'total_quantity': 32,
  'is_line_created': true,
  'line': {
    'id': 3,
    'line_reference': '14_3',
    'quantity': 1,
     'product': {
        'url': '/path/to/product/',
        'id': 11,
        'title': 'Mesns Watch',
        'price': 23.3,
        'image': '/path/to/image/thumnail/'
    }
  }
}