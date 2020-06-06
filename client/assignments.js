// adapted from public/js/pages/assignmentsList.js
/**
 * Changes:
 * - removed code that has been converted to react component
 * - changed param of editNewConfig from event e(not used) to a function to update assignmentnotes
**/

var editNewConfig = function(updateAssignment, configInvitation) {
  $('#note-editor-modal').remove();
  $('body').append(Handlebars.templates.genericModal({
    id: 'note-editor-modal',
    extraClasses: 'modal-lg',
    showHeader: true,
    title: 'New Configuration',
    showFooter: false
  }));

  $('#note-editor-modal').modal('show');
  view.mkNewNoteEditor(configInvitation, null, null, null, {
    onNoteCreated: hideEditorModalAndUpdate,
    onNoteCancelled: hideEditorModal,
    onError: showDialogErrorMessage,
    onValidate: validateConfigNoteForm,
    onCompleted: appendEditorToModal
  });
};

var hideEditorModalAndUpdate = function() {
  $('#note-editor-modal').modal('hide');
  updateAssignment();  //this is changes to be a param from react components
};

var hideEditorModal = function() {
  $('#note-editor-modal').modal('hide');
};

var showDialogErrorMessage = function(errors) {
  $('#note-editor-modal .modal-body .alert-danger').remove();

  $('#note-editor-modal .modal-body').prepend(
    '<div class="alert alert-danger"><strong>Error:</strong> </div>'
  );
  if (errors && errors.length) {
    errors.forEach(function(e, i) {
      var separator = (i === errors.length - 1) ? '' : ', ';
      $('#note-editor-modal .modal-body .alert-danger').append(translateErrorMessage(e), separator);
    });
  } else {
    var errorText = 'Could not save note';
    $('#note-editor-modal .modal-body .alert-danger').append(errorText);
  }
  $('#note-editor-modal').animate({scrollTop: 0}, 400);
};

var validateConfigNoteForm = function(invitation, configContent, note) {
  var errorList = [];

  // Don't allow saving an existing note if its title matches that of some other in the list.
  var matchingNote = _.find(assignmentNotes, function(n) {
    var idMatch = note ? n.id !== note.id : true;
    return n.content.title === configContent.title && idMatch;
  });
  if (matchingNote) {
    errorList.push('The configuration title must be unique within the conference');
  }

  // Make sure an equal number of scores and weights are provided
  if (configContent.scores_names && configContent.scores_weights &&  // jshint ignore:line
      configContent.scores_names.length !== configContent.scores_weights.length) {  // jshint ignore:line
    errorList.push('The scores and weights must have same number of values');
  }

  return errorList;
};

var appendEditorToModal = function(editor) {
  $('#note-editor-modal .modal-body').empty().addClass('legacy-styles').append(editor);
  view.hideNoteEditorFields('#note-editor-modal', [
    'config_invitation', 'assignment_invitation', 'error_message', 'status'
  ]);
};

var editExistingConfig = function(e) {
  $('#note-editor-modal').remove();
  $('body').append(Handlebars.templates.genericModal({
    id: 'note-editor-modal',
    extraClasses: 'modal-lg',
    showHeader: true,
    title: 'Edit Configuration',
    showFooter: false
  }));
  $('#note-editor-modal').modal('show');

  var id = $(e.target).closest('tr').data('id');
  var configNote = getConfigNote(id);
  view.mkNoteEditor(configNote, configInvitation, null, {
    onNoteEdited: hideEditorModalAndUpdate,
    onNoteCancelled: hideEditorModal,
    onError: showDialogErrorMessage,
    onValidate: validateConfigNoteForm,
    onCompleted: appendEditorToModal
  });
};

var editClonedConfig = function(e) {
  $('#note-editor-modal').remove();
  $('body').append(Handlebars.templates.genericModal({
    id: 'note-editor-modal',
    extraClasses: 'modal-lg',
    showHeader: true,
    title: 'Copy Configuration',
    showFooter: false
  }));
  $('#note-editor-modal').modal('show');

  var id = $(e.target).closest('tr').data('id');
  var configNote = getConfigNote(id);
  var titleSplit = configNote.content.title.split('-');
  var titleSuffix = parseInt(titleSplit[titleSplit.length - 1], 10);
  if (isNaN(titleSuffix)) {
    titleSplit.push(1);
  } else {
    titleSplit = titleSplit.slice(0, -1);
    titleSplit.push(titleSuffix + 1);
  }
  var clone = _.cloneDeep(configNote);
  clone = _.omit(clone, ['id', 'cdate', 'forum', 'number', 'tcdate', 'tmdate', '_id']);
  clone.content.status = 'Initialized';
  clone.content.title = titleSplit.join('-');
  view.mkNoteEditor(clone, configInvitation, null, {
    onNoteEdited: hideEditorModalAndUpdate,
    onNoteCancelled: hideEditorModal,
    onError: showDialogErrorMessage,
    onValidate: validateConfigNoteForm,
    onCompleted: appendEditorToModal
  });
};

module.exports={
  editNewConfig,
  editExistingConfig,
  editClonedConfig
}
