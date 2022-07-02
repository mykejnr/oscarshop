import { TSubmitFormErrors } from "../typedefs/form"

/**
 * Extrats and return an array of errors from server errors which may be an 
 * object of nested objects of just a simple flat objec
 * @param errors server errors, may be nested object eg:
 *   {
 *      first_name: [list of errors],
 *      shipping_address: {
 *        country: ['not applicable']
 *      }
 *   }
 * @param name name of a form field. Could be a path
 *    eg. 'first_name', 'shipping_address.country'
 * @returns an array of errors aka string[] for the given field name
 */
export const extractFieldErros = <TFormData, >(errors: TSubmitFormErrors<TFormData>, name: string): string[] | undefined => {
  const fields = name.split('.')
  let extractedErrors: any = {...errors}

  for (const field of fields) {
      extractedErrors = extractedErrors[field as never]
      if (extractedErrors === undefined) break
  }

  return extractedErrors
}