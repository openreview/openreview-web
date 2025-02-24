import { useReducer } from 'react'

const fieldEditorReducer = (state, action) => {
  switch (action.type) {
    case 'SELECT_FIELD':
      console.log('SELECT_FIELD', action)
      console.log('SELECT_FIELD STATE', state)
      return { ...state, selectedIndex: action.payload }
    case 'UPDATE_FIELD': {
      const updatedFields = [...state.fields]
      updatedFields[action.payload.index] = {
        ...updatedFields[action.payload.index],
        ...action.payload.data,
      }
      return { ...state, fields: updatedFields }
    }
    case 'ADD_FIELD':
      return { ...state, fields: [...state.fields, action.payload], selectedIndex: state.fields.length }
    case 'DELETE_FIELD':{
      const newFields = state.fields.filter((_, i) => i !== action.payload)
      return {
        ...state,
        fields: newFields,
        selectedIndex: state.selectedIndex >= newFields.length ? null : state.selectedIndex,
      }
    }
    case 'REORDER_FIELDS':
      return { ...state, fields: action.payload }
    case 'SET_ALL_FIELDS':
      return {
        ...state,
        fields: action.payload,
        // Preserve the existing selectedIndex if it’s within bounds; otherwise leave it as null.
        selectedIndex:
        state.selectedIndex !== null && state.selectedIndex < action.payload.length
          ? state.selectedIndex
          : null,
      }
    default:
      return state
  }
}

const useFieldEditorState = (initialFields) => {
  const initialState = {
    fields: initialFields,
    selectedIndex: null,
  }

  const [state, dispatch] = useReducer(fieldEditorReducer, initialState)

  const selectField = (index) => dispatch({ type: 'SELECT_FIELD', payload: index })
  const updateField = (index, data) => dispatch({ type: 'UPDATE_FIELD', payload: { index, data } })
  const addField = (field) => dispatch({ type: 'ADD_FIELD', payload: field })
  const deleteField = (index) => dispatch({ type: 'DELETE_FIELD', payload: index })
  const setAllFields = (newFields) => dispatch({ type: 'SET_ALL_FIELDS', payload: newFields })
  const reorderFields = (newFields) => dispatch({ type: 'REORDER_FIELDS', payload: newFields })

  return {
    fields: state.fields,
    selectedIndex: state.selectedIndex,
    selectedField: state.fields[state.selectedIndex] || null,
    selectField,
    updateField,
    addField,
    deleteField,
    setAllFields,
    reorderFields
  }
}

export default useFieldEditorState
