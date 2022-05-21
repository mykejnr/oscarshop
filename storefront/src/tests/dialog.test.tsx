import {render, fireEvent, waitFor, screen} from '@testing-library/react'
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

test("Should unmount dialog on close event", () => {
  render (
    <Provider store={store}>
      <Dialog name='signup'/>
    </Provider>
  )

  act(() => store.dispatch(showDialog('signup')))
  const elem = screen.getByTestId('signup-form')
  expect(elem.tagName.toLowerCase()).toEqual('form')

  const bElem = screen.getByTestId('close-dialog')
  act(() => fireEvent.click(bElem) as never)
  const elemNo = screen.getByTestId('nodialog')
  expect(elemNo.tagName.toLowerCase()).toEqual('div')
  
})
