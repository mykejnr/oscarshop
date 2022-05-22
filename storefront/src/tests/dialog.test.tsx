import {render, fireEvent, screen, waitFor} from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux';

import { resetState, showDialog } from '../actions';
import store from "../store/index";

import Dialog from '../dialog/dialog';
import { act } from 'react-dom/test-utils';


beforeEach(() => store.dispatch(resetState()))


test("Should show dialog", () => {
  render (
    <Provider store={store}>
      <Dialog name='signup'/>
    </Provider>
  )
  act(() => store.dispatch(showDialog('signup')))
  

  const elem = screen.getByTestId('signup-form')
  expect(elem.tagName.toLowerCase()).toEqual('form')
})

test("Should unmount dialog on close event", async () => {
  render (
    <Provider store={store}>
      <Dialog name='signup'/>
    </Provider>
  )

  act(() => store.dispatch(showDialog('signup')))
  const elem = screen.getByTestId('signup-form')
  expect(elem.tagName.toLowerCase()).toEqual('form')

  const bElem = screen.getByTestId('close-dialog')
  await act(() => fireEvent.click(bElem) as never)

  await waitFor(() => expect(bElem).not.toBeInTheDocument())
  
})
