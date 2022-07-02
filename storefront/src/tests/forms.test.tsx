import { extractFieldErros } from "../forms/utils"
import { TSubmitFormErrors } from "../typedefs/form"


interface ITestShippingData {
    postcode: string
}

interface IBillingData {
    address_book: {
        phone_number: string
    }
}

interface ITestData {
    first_name: string
    email: string,
    shipping_address: ITestShippingData,
    billing_address: IBillingData
}


const testErrors: TSubmitFormErrors<ITestData> = {
    first_name: ['first_name is required'],
    email: ['Invalid email address'],
    shipping_address: {
        postcode: ['Post code does not match with country']
    },
    billing_address: {
        address_book: {
            phone_number: ['Please phone number is required']
        }
    }
}

test("extractFieldErrors() - returns field errors", () => {
    const errors = extractFieldErros(testErrors, 'first_name')
    expect(errors).toStrictEqual(testErrors.first_name)
})

test("extractFieldErrors() - returns field errors two levels deep", () => {
    const errors: any = extractFieldErros(testErrors, 'shipping_address.postcode')
    const shipping_errors = testErrors.shipping_address || {}
    expect(errors).toStrictEqual(shipping_errors['postcode' as never])
})

test("extractFieldErrors() - returns field errors three levels deep", () => {
    const errors: any = extractFieldErros(testErrors, 'billing_address.address_book.phone_number')
    const billing_errors = testErrors.billing_address || {}
    const address_errors = billing_errors['address_book' as never]
    expect(errors).toStrictEqual(address_errors['phone_number' as never])
})

test("extractFieldErrors() - returns undefined nonexisiting field error", () => {
    const errors: any = extractFieldErros(testErrors, 'nofield_error')
    expect(errors).toStrictEqual(undefined)
})

test("extractFieldErrors() - returns undefined nested nonexisiting field error", () => {
    const errors: any = extractFieldErros(testErrors, 'shipping_address.nofield_error')
    expect(errors).toStrictEqual(undefined)
})