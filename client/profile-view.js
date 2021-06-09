/**
 * Changes:
 * - replaced first line with module.exports
 * - replaced all controller api calls with webfield versions
 * - added btn-default class to cancel button
 */
import { apiV2MergeNotes } from '../lib/utils'
module.exports = function(profile, params, submitF, cancelF) {

  var mkGenderRow = function(gender) {
    var genderOptions = ['Male', 'Female', 'Non-Binary', 'Not Specified'];

    var filteredPositions = function(options, prefix) {
      return _.filter(options, function(p) {
        return _.startsWith(p.toLowerCase(), prefix.toLowerCase());
      });
    };

    var $gender = view.mkDropdown('Choose a gender or type a custom gender', false, gender, function(update, prefix) {
      update(filteredPositions(genderOptions, prefix));
    }, function(value) {});
    $gender.find('input').addClass('gender');

    var $row = $('<tr>', {border: 0, class: 'info_row'}).append(
      $('<td>', {class: 'info_item'}).append($gender)
    );

    return $row;
  };

  var mkEmailRow = function(profileId, email, confirmed, preferred, preferredHandler) {
    var $input = $('<input>', {
      type: 'email',
      class: 'form-control email profile',
      value: email || '',
      maxlength: 254,
      readonly: confirmed
    });
    $input.keyup(function() {
      if ($(this).attr('readonly')) {
        return;
      }
      var currentVal = $(this).val().trim().toLowerCase();
      if (view.isValidEmail(currentVal)) {
        $confirmCell.find('.confirmed').hide();
        $confirmCell.find('.confirm_button').show();
        $removeEmailCell.show();
        $(this).removeClass('invalid_value');
      } else {
        $confirmCell.find('.confirmed').hide();
        $confirmCell.find('.confirm_button').hide();
        $removeEmailCell.hide();
        if (currentVal) {
          $(this).addClass('invalid_value');
        } else {
          $(this).removeClass('invalid_value');
        }
      }
      return true;
    });

    var $btn = $('<button class="btn confirm_button">Confirm</button>');
    $btn.click(function() {
      if (profileId) {
        var newEmail = $input.val().toLowerCase();
        var linkData = { alternate: newEmail, username: profileId };
        Webfield.post('/user/confirm', linkData).then(function() {
          promptMessage('A confirmation email has been sent to ' + newEmail);
        });
      } else {
        promptError('You need to save your profile before confirming a new email');
      }
    });

    var $confirmCell = $('<td>', {class: 'confirm_cell'}).append(
      $('<div>', {text: '(Confirmed)', class: 'confirmed hint'}),
      $btn
    );
    var $preferredCell = $('<td>', {class: 'preferred_cell'}).append(
      $('<div>', {text: '(Preferred Email)', class: 'preferred hint'}),
      $('<button class="btn preferred_button">Make Preferred</button>').click(preferredHandler)
    );
    var $removeEmailCell = $('<td>').append(
      $('<button class="btn">Remove</button>').click(function() {
        $(this).closest('tr').remove();
      })
    );

    var $row = $('<tr>', {border: 0, class: 'info_row'}).append(
      $('<td>', {class: 'info_item'}).append($input),
      $confirmCell,
      $removeEmailCell
    );

    if (confirmed) {
      $confirmCell.find('.confirmed').show();
      $confirmCell.find('.confirm_button').hide();
      $removeEmailCell.hide();
      $row.append($preferredCell);
    } else {
      if (email) {
        $confirmCell.find('.confirmed').hide();
        $confirmCell.find('.confirm_button').show();
        $removeEmailCell.show();
      } else {
        $confirmCell.find('.confirmed').hide();
        $confirmCell.find('.confirm_button').hide();
        $removeEmailCell.hide();
      }
    }

    if (preferred) {
      $preferredCell.find('.preferred').show();
      $preferredCell.find('.preferred_button').hide();
    } else {
      if (confirmed) {
        $preferredCell.find('.preferred').hide();
        $preferredCell.find('.preferred_button').show();
      } else {
        $preferredCell.find('.preferred').hide();
        $preferredCell.find('.preferred_button').hide();
      }
    }

    return $row;

  };

  var mkHistoryHeader = function() {
    return $('<tr>', {border: 0}).append(
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'Position', class: 'small_heading row_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'Start', class: 'small_heading row_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'End', class: 'small_heading row_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {class: 'row_heading'}).append(
          $('<div>', {text: 'Institution Domain', class: 'item small_heading'})
        )
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {class: 'row_heading'}).append(
          $('<div>', {text: 'Institution Name', class: 'item small_heading'})
        )
      ),
      $('<td>', {class: 'info_item'}).append()
    );
  };

  var mkHistoryRow = function(prefill, prefixedPositions, prefixedInstitutions, institutions) {

    var filteredPositions = function(positions, prefix) {
      return _.filter(positions, function(p) {
        return _.startsWith(p.toLowerCase(), prefix.toLowerCase());
      });
    };

    var $position = view.mkDropdown('Choose a position or type a new one', false, prefill && prefill.position, function(update, prefix) {
      update(filteredPositions(prefixedPositions, prefix));
    }, function(value) {
      if (!_.isEmpty(value)) {
        prefixedPositions = _.union(prefixedPositions, [value]);
      }
    });
    $position.find('input').addClass('position');

    var $domain = view.mkDropdown('Choose a domain or type a new one', false, prefill && prefill.institution && prefill.institution.domain, function(update, prefix) {
      update(filteredPositions(prefixedInstitutions, prefix));
    }, function(value) {
      if (!_.isEmpty(value)) {
        prefixedInstitutions = _.union(prefixedInstitutions, [value]);
      }
      fillInstitutionName(value);
    });
    $domain.find('input').addClass('institution_domain');


    var $row = $('<tr>', {border: 0, class: 'info_row'}).append(
      $('<td>', {class: 'info_item'}).append(
        $position
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control start', value: prefill && prefill.start || '', placeholder: 'year', 'aria-label': 'start year' }).keypress(isNumber).on('paste', isPositiveInteger)
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control end', value: prefill && prefill.end || '', placeholder: 'year', 'aria-label': 'end year'}).keypress(isNumber).on('paste', isPositiveInteger)
      ),
      $('<td>', {class: 'info_item'}).append(
        $domain
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control institution_name', value: prefill && prefill.institution && prefill.institution.name || '', 'aria-label': 'institution name'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {class: 'glyphicon glyphicon-minus-sign'})
          .attr({
            tabindex: 0,
            "aria-label": "remove this education career history record",
            role: "button"
          })
          .click(function(event) {
            $row.remove();

            var $table = $('#history_table');
            if ($table.find('tr.info_row').length === 1) {
              $table.find('tr.info_row div.glyphicon-minus-sign').hide();
            }
          })
      )
    );

    var fillInstitutionName = function(domain) {

      var findInstitution = function(domain) {
        return _.find(institutions, function(i) {
          return i.id.toLowerCase() === domain.toLowerCase();
        });
      };

      var $institutionName = $row.find('.institution_name');
      if (domain) {
        var institution = findInstitution(domain);
        if (institution) {
          var institutionName = institution.fullname;
          var parentInstitution = institution.parent ? findInstitution(institution.parent): null;
          if (parentInstitution && parentInstitution.fullname) {
            institutionName = institutionName + ', ' + parentInstitution.fullname;
          }
          $institutionName.val(institutionName);
        } else {
          $institutionName.val('');
        }
      }
    };

    return $row;

  };

  var mkRelationHeader = function() {

    var $row = $('<tr>', {border: 0}).append(
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'Relation', class: 'small_heading row_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'Name', class: 'small_heading row_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'Email', class: 'small_heading row_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'Start', class: 'small_heading row_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text:'End', class: 'small_heading row_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'Visible to', class: 'small_heading row_heading visible-heading'})
      ),
    );

    return $row;
  };

  var mkRelationRow = function(prefill, prefixedRelations, prefixedRelationReaders) {

    var filteredPositions = function(positions, prefix) {
      return _.filter(positions, function(p) {
        return _.startsWith(p.toLowerCase(), prefix.toLowerCase());
      });
    };

    var $relation = view.mkDropdown('Choose a relation or type a new one', false, prefill && prefill.relation, function(update, prefix) {
      update(filteredPositions(prefixedRelations, prefix));
    }, function(value) {
      if (!_.isEmpty(value)) {
        prefixedRelations = _.union(prefixedRelations, [value]);
      }
    });
    $relation.find('input').attr({class:'form-control relation'});

    var getDropdownText = function(readers) {
      if (!readers || readers.includes('everyone')) return 'everyone';
      return _.truncate(readers.join(','), { length: 12 });
    }

    var uniqueId = 'relation-reader-' + _.random(1, 1000);

    var $relationReader = Handlebars.templates['partials/multiselectorDropdown']({
      buttonText: getDropdownText(prefill.readers),
      id: uniqueId,
      htmlFilters: prefixedRelationReaders?.map(p => ({ valueFilter: p, textFilter: view.prettyId(p) })),
      hideSelectAll: true
    });

    var $row = $('<tr>', {border: 0, class: 'info_row'}).append(
      $('<td>', {class: 'info_item'}).append(
        $relation
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control relation_name', value: prefill && prefill.name || '', 'aria-label': 'name of person of this relation'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control relation_email', value: prefill && prefill.email || '', 'aria-label': 'email of person of this relation'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control start', value: prefill && prefill.start || '', placeholder: 'year', 'aria-label': 'relation start year'}).keypress(isNumber).on('paste', isPositiveInteger)
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control end', value: prefill && prefill.end || '', placeholder: 'year', 'aria-label': 'relation end year'}).keypress(isNumber).on('paste', isPositiveInteger)
      ),
      $('<td>', {class: 'info_item'}).append(
        $($relationReader).attr({'aria-label':'to whom this relation is visible to'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {class: 'glyphicon glyphicon-minus-sign '})
          .attr({
            tabindex: 0,
            "aria-label": "remove this relation record",
            role: "button"
          })
          .click(function(event) {
            $row.remove();
          })
      )
    );

    $row.find('.multiselector').data('val', prefill.readers || ['everyone']); // store the array value
    $row.find('.dropdown-menu input').prop('checked', false);
    $row.find('.dropdown-menu input[value="everyone"]').prop('checked', true); // everyone is the default value in case no reader present
    if (prefill.readers) {
      $row.find('.dropdown-menu input').each((index, element) => { $(element).prop('checked', prefill.readers.includes(element.value)) });
    }

    $row.find('.dropdown-menu').on('change', (e) => {
        var selectedReaders = [];
        $row.find('.dropdown-menu input.' + uniqueId + '-multiselector-checkbox:checked').each((index, element) => selectedReaders.push(element.value));
        // uncheck everyone when another option is selected
        if(e.target.value!=='everyone' && e.target.checked) {
          $row.find('.dropdown-menu input[value="everyone"]').prop('checked', false);
          selectedReaders = selectedReaders.filter(p => p !== 'everyone');
        }
        // set default value (everyone) if nothing selected
        if (selectedReaders.length === 0) {
          $row.find('.dropdown-menu input[value="everyone"]').prop('checked', true);
          selectedReaders.push('everyone');
        }
        // set display text
        $row.find('.multiselector .dropdown-toggle').html(getDropdownText(selectedReaders));
        // set data attr
        $row.find('.multiselector').data('val', selectedReaders);
    });
    return $row;

  };

  var mkExpertiseHeader = function() {
    var $row = $('<tr>', {border: 0, class: ''}).append(
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {class: 'row_heading'}).append(
          $('<div>', {text: 'Research areas of interest', class: 'item small_heading'})
        )
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'Start', class: 'small_heading row_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'End', class: 'small_heading row_heading'})
      )
    );
    return $row;
  };

  var mkExpertiseRow = function(expertise, start, end) {

    var $row = $('<tr>', {border: 0, class: 'info_row'}).append(
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control expertise', value: expertise || '', 'aria-label': 'research areas of interest, separated by comma'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control start', value: start || '', placeholder: 'year', 'aria-label': 'start year'}).keypress(isNumber).on('paste', isPositiveInteger)
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control end', value: end || '', placeholder: 'year', 'aria-label': 'end year'}).keypress(isNumber).on('paste', isPositiveInteger)
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {class: 'glyphicon glyphicon-minus-sign '})
          .attr({
            tabindex: 0,
            "aria-label": "remove this expertise record",
            role: "button"
          })
          .click(function(event) {
            $row.remove();
          })
      )
    );

    return $row;
  };

  var mkNameHeader = function() {
    return $('<tr>', {border: 0, class: ''}).append(
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'First', class: 'small_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {class: 'small_heading'}).append(['Middle ', '<span class="hint">(optional)</span>'])
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: 'Last', class: 'small_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
         $('<div>', {text: '', class: 'small_heading'})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<div>', {text: '', class: 'small_heading'})
      )
    );
  };

  var mkNameRow = function(first, middle, last, username, altUsernames, preferred, preferredHandler, newRow, hideRow) {
    var readonly = !_.isEmpty(username);
    var displayNewUsername = function($nameRow) {
      return function() {
        var firstVal = $nameRow.find('.first_name').val();
        var middleVal = $nameRow.find('.middle_name').val();
        var lastVal = $nameRow.find('.last_name').val();

        var first = firstVal.length === 1 ? firstVal.toUpperCase() : firstVal;
        var middle = middleVal.length === 1 ? middleVal.toUpperCase() : middleVal;
        var last = lastVal.length === 1 ? lastVal.toUpperCase() : lastVal;

        $nameRow.find('.first_name').val(first);
        $nameRow.find('.middle_name').val(middle);
        $nameRow.find('.last_name').val(last);

        Webfield.get('/tildeusername', {
          first: first,
          last: last,
          middle: middle,
        }).then(function(result) {
          if (first === $nameRow.find('.first_name').val()
            && middle === $nameRow.find('.middle_name').val()
            && last === $nameRow.find('.last_name').val()) {
            $nameRow.find('.newUsername').text(result.username);
          }
        }, function() {
          $nameRow.find('input').addClass('invalid_value');
        });
      };
    };

    var removeUnconfirmedRow = function() {
      $(this).closest('tr.info_row').remove();
      return false;
    };

    var extraClasses = hideRow ? 'hidden' : '';
    var $row = $('<tr>', {border: 0, class: 'info_row ' + extraClasses}).append(
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control first_name profile', value: first || '', readonly: readonly})
          .attr({'aria-label':"first name"})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control middle_name profile', value: middle || '', readonly: readonly})
          .attr({'aria-label':"middle name"})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<input>', {type: 'text', class: 'form-control last_name profile', value: last || '', readonly: readonly})
          .attr({'aria-label':"last name"})
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<span>', {class: 'newUsername'}).text(username)
      ),
      $('<td>', {class: 'info_item'}).append(
        $('<span>', {class: 'username'}).text(username).hide()
      ),
      $('<td>', {class: 'info_item preferred_cell'}).append(
        $('<span>', {text: '(Preferred Name)', class: 'preferred hint'}).attr({tabindex:0,"aria-label":"this is your preferred name",role:"text"}),
        $('<button class="btn preferred_button">Make Preferred</button>').click(preferredHandler),
        $('<button class="btn remove_button" style="display: none;">Remove</button>').click(removeUnconfirmedRow)
      )
    );

    if (altUsernames && altUsernames.length) {
      $row.find('.newUsername').append(', <span data-toggle="tooltip" data-placement="top" title="' +
        altUsernames.join(', ') + '">+' + altUsernames.length + ' more</span>');
    }

    if (!newRow && readonly) {
      if (preferred) {
        $row.find('.preferred').show();
        $row.find('.preferred_button').hide();
      } else {
        $row.find('.preferred').hide();
        $row.find('.preferred_button').show();
      }
    } else {
      $row.find('.preferred').hide();
      $row.find('.preferred_button').hide();
      $row.find('.remove_button').show();
    }

    $row.find('.first_name').keyup(displayNewUsername($row));
    $row.find('.middle_name').keyup(displayNewUsername($row));
    $row.find('.last_name').keyup(displayNewUsername($row));

    return $row;
  };

  var periodSorter = function(a, b) {

    var compareStart = function(s1, s2) {
      if (!s1 && !s2) {
        return 1;
      }

      if (!s1) {
        return -1;
      }

      if (!s2) {
        return 1;
      }

      return (s2 - s1);
    };

    if (!a.end && !b.end) {
      return compareStart(a.start, b.start);
    }

    if (!a.end) {
      return -1;
    }

    if (!b.end) {
      return 1;
    }

    var diff = (b.end - a.end);

    if (diff === 0) {
      return compareStart(a.start, b.start);
    }

    return diff;
  };

  var isNumber = function(e) {
    var charCode = e.charCode;
    // Allow delete, tab and enter keys
    if (charCode === 0) {
      return true;
    }
    // Deny all other non-numeric keys
    if (String.fromCharCode(charCode).match(/[^0-9]/g)) {
      return false;
    }
  };

  var isPositiveInteger = function(e) {
    var number = Number(e.originalEvent.clipboardData.getData('text'));
    return Number.isInteger(number) && number > 0;
  };

  var drawView = function(profile, prefixedPositions, prefixedInstitutions, institutions, prefixedRelations, prefixedRelationReaders) {

    var $namesTable = $('<table>', {id: 'names_table', class: 'info_table'}).append(
      mkNameHeader()
    );

    var preferredHandler = function(event) {
      $namesTable.find('.preferred').hide();
      $namesTable.find('.preferred_button').show();
      var $parent = $(event.target).parent();
      $parent.find('.preferred').show();
      $parent.find('.preferred_button').hide();
    };

    if (profile.names && profile.names.length) {
      $namesTable.append(profile.names.map(function(name) {
        return mkNameRow(
          name.first, name.middle, name.last, name.username, name.altUsernames,
          name.preferred, preferredHandler, false, name.duplicate
        );
      }));
    } else {
      $namesTable.append(mkNameRow('', '', '', '', [], true, preferredHandler, true));
    }

    var $addNameRow = $('<div>', {class: 'glyphicon glyphicon-plus-sign'})
      .attr({
        tabindex: 0,
        "aria-label": "add another name",
        role: "button"
      })
      .click(function() {
        $namesTable.append(mkNameRow('', '', '', '', [], false, preferredHandler, true));
        $namesTable.find('.info_row').last().find('input').first().focus()
      });

    var $personalTable = $('<table>', {id: 'personal_table', class: 'info_table'}).append(
      mkGenderRow(profile.gender)
    );

    var $emailsTable = $('<table>', {id: 'emails_table', class: 'info_table'});

    var emailPreferredHandler = function(event) {
      $emailsTable.find('.preferred').hide();
      $emailsTable.find('.preferred_button').show();

      var $parent = $(event.target).parent();
      $parent.find('.preferred').show();
      $parent.find('.preferred_button').hide();
    };

    var emails = profile.emails;
    var emailsConfirmed = profile.emailsConfirmed;
    var preferredEmail = profile.preferredEmail;
    if (emails && emails.length) {
      $emailsTable.append(_.flatten(_.map(emails, function(email) {
        return [
          mkEmailRow(profile.id, email.email, email.confirmed, email.preferred, emailPreferredHandler)
        ];
      })));
    } else {
      $emailsTable.append(
        mkEmailRow(profile.id, '', false, false, emailPreferredHandler),
        mkEmailRow(profile.id, '', false, false, emailPreferredHandler),
        mkEmailRow(profile.id, '', false, false, emailPreferredHandler)
      );
    }

    var $addInfoRow = $('<div>', {class: 'glyphicon glyphicon-plus-sign '})
      .attr({
        tabindex: 0,
        "aria-label": "add another email",
        role: "button"
      })
      .click(function() {
        $emailsTable.append(mkEmailRow(profile.id, '', false, false, emailPreferredHandler));
        $emailsTable.find('.info_row').last().find('input').first().focus()
      });

    var $historyTable = $('<table>', {id: 'history_table', class: 'info_table'}).append(
      mkHistoryHeader()
    );
    var history = profile.history;

    if (history && history.length) {
      $historyTable.append(_.flatten(_.map(history, function(link) {
        return [
          mkHistoryRow(link, prefixedPositions, prefixedInstitutions, institutions)
        ];
      })));
    } else {
      $historyTable.append(
        mkHistoryRow({}, prefixedPositions, prefixedInstitutions, institutions),
        mkHistoryRow({}, prefixedPositions, prefixedInstitutions, institutions),
        mkHistoryRow({}, prefixedPositions, prefixedInstitutions, institutions)
      );
    }
    if ($historyTable.find('tr.info_row').length === 1) {
      $historyTable.find('tr.info_row div.glyphicon-minus-sign').hide();
    }

    var $addHistoryRow = $('<div>', {class: 'glyphicon glyphicon-plus-sign '})
      .attr({
        tabindex: 0,
        "aria-label": "add another education & career history record",
        role: "button"
      })
      .click(function() {
        $historyTable.append(mkHistoryRow({}, prefixedPositions, prefixedInstitutions, institutions));
        $historyTable.find('tr.info_row div.glyphicon-minus-sign').show()
        $historyTable.find('.info_row').last().find('input').first().focus()
      });

    var $relationTable = $('<table>', {id: 'relation_table', class: 'info_table'}).append(
      mkRelationHeader()
    );

    var relations = profile.relations;
    if (relations && relations.length) {
      $relationTable.append(_.flatten(_.map(relations, function(relation) {
        return [mkRelationRow(relation, prefixedRelations, prefixedRelationReaders)];
      })));
    } else {
      $relationTable.append(
        mkRelationRow({readers: ['everyone']}, prefixedRelations, prefixedRelationReaders),
        mkRelationRow({readers: ['everyone']}, prefixedRelations, prefixedRelationReaders),
        mkRelationRow({readers: ['everyone']}, prefixedRelations, prefixedRelationReaders)
      );
    }

    var $addRelationRow = $('<div>', {class: 'glyphicon glyphicon-plus-sign '})
      .attr({
        tabindex: 0,
        "aria-label": "add another advisor or other relation",
        role: "button"
      })
      .click(function() {
        $relationTable.append(mkRelationRow({readers: ['everyone']}, prefixedRelations, prefixedRelationReaders));
        $relationTable.find('.info_row').last().find('input').first().focus()
      });

    var homepageVal = _.get(_.find(profile.links, ['key', 'homepage']), 'url', '');
    var gscholarVal = _.get(_.find(profile.links, ['key', 'gscholar']), 'url', '');
    var dblpVal = _.get(_.find(profile.links, ['key', 'dblp']), 'url', '');
    var orcidVal = _.get(_.find(profile.links, ['key', 'orcid']), 'url', '');
    var wikipediaVal = _.get(_.find(profile.links, ['key', 'wikipedia']), 'url', '');
    var linkedinVal = _.get(_.find(profile.links, ['key', 'linkedin']), 'url', '');
    var semanticScholarVal = _.get(_.find(profile.links, ['key','semanticScholar']), 'url', '');

    var $urlTable1 = $('<table>', {id: 'url1_table', class: 'info_table'}).append(
      $('<tr>', {border: 0, class: ''}).append(
        $('<td>', {class: 'info_item'}).append(
          $('<div>', {text: 'Homepage URL', class: 'small_heading', id:'homepageurl-label'})
        ),
        $('<td>', {class: 'info_item'}).append(
          $('<div>', {text: 'Google Scholar URL', class: 'small_heading',id:"googlescholarurl-label"})
        )
      ),
      $('<tr>', {border: 0, class: 'info_row'}).append(
        $('<td>', {class: 'info_item'}).append(
          $('<input>', {class: 'form-control', type: 'text', id: 'homepage_url', value: homepageVal, "aria-labelledby":"homepageurl-label"})
        ),
        $('<td>', {class: 'info_item'}).append(
          $('<input>', {class: 'form-control', type: 'text', id: 'gscholar_url', value: gscholarVal, "aria-labelledby":"googlescholarurl-label"})
        )
      ),

      $('<tr>', { border: 0, class: '' }).append(
        $('<td>', { class: 'info_item'}).append(
          $('<div>', { text: 'DBLP URL', class: 'small_heading', id: 'dblpurl-label' }).append(
            $('<a>', { class: 'faq-link', href: '/faq#question-dblp-import', target: '_blank', rel: 'noreferrer', role:'link', 'aria-label':'check help of importing dblp publications' }).append(
              '<span class="glyphicon glyphicon-info-sign"></span>'
            )
          )
        )
      ),
      $('<tr>', { border: 0, class: 'info_row' }).append(
        $('<td>', { class: 'info_item' }).append(
          $('<input>', {
            id: 'dblp_url',
            type: 'text',
            class: 'form-control',
            value: dblpVal,
            'aria-labelledby': 'dblpurl-label'
          }).on('input', function () {
            if (params.hideDblpButton) return;
            $('#show-dblp-import-modal').attr('disabled', !$(this).val());
          })
        ),
        $('<td>', { class: 'info_item' }).append(
          params.hideDblpButton ? null : $('<button>', {
            id: 'show-dblp-import-modal',
            class: 'btn btn-primary',
            text: 'Add DBLP Papers to Profile',
            disabled: !dblpVal,
          }).on('click', function() {
            $('#dblp-import-modal').modal({
              show: true,
              backdrop: 'static',
              keyboard: false,
            });
          })
        )
      ),

      $('<tr>', { border: 0, class: '' }).append(
        $('<td>', { class: 'info_item'}).append(
          $('<div>', {text: 'ORCID URL', class: 'small_heading', id: 'orcidurl-label'})
        ),
        $('<td>', {class: 'info_item'}).append(
          $('<div>', {text: 'Wikipedia URL', class: 'small_heading', id: 'wikipediaurl-label'})
        )
      ),
      $('<tr>', { border: 0, class: 'info_row' }).append(
        $('<td>', { class: 'info_item' }).append(
          $('<input>', {class: 'form-control', type: 'text', id: 'orcid_url', value: orcidVal, 'aria-labelledby': 'orcidurl-label'})
        ),
        $('<td>', {class: 'info_item'}).append(
          $('<input>', {class: 'form-control', type: 'text', id: 'wikipedia_url', value: wikipediaVal, 'aria-labelledby': 'wikipediaurl-label'})
        )
      ),

      $('<tr>', {border: 0, class: ''}).append(
        $('<td>', {class: 'info_item'}).append(
          $('<div>', {text: 'Linkedin URL', class: 'small_heading', id: 'linkedinurl-label'})
        ),
        $('<td>', {class: 'info_item'}).append(
          $('<div>', { text: 'Semantic Scholar URL', class: 'small_heading', id: 'semanticscholarurl-label'}).append(
            $('<a>', { class: 'faq-link', href: '/faq#question-semantic-scholar', target: '_blank', rel: 'noreferrer', 'aria-label': 'check help of semantic scholar url' }).append(
              '<span class="glyphicon glyphicon-info-sign"></span>'
            )
          )
        )
      ),
      $('<tr>', {border: 0, class: 'info_row'}).append(
        $('<td>', {class: 'info_item'}).append(
          $('<input>', {class: 'form-control', type: 'text', id: 'linkedin_url', value: linkedinVal, 'aria-labelledby':'linkedinurl-label'})
        ),
        $('<td>', {class: 'info_item'}).append(
          $('<input>', {class: 'form-control', type: 'text', id: 'semanticScholar_url', value: semanticScholarVal, 'aria-labelledby':'semanticscholarurl-label'})
        )
      )
    );

    var $expertiseTable = $('<table>', {id: 'expertise_table', class: 'info_table'}).append(
      mkExpertiseHeader());
    var expertise = profile.expertise;
    if (expertise && expertise.length) {
      $expertiseTable.append(_.flatten(_.map(expertise, function(e) {
        return [mkExpertiseRow(e.keywords.join(', '), e.start, e.end)];
      })));
    } else {
      $expertiseTable.append(
        mkExpertiseRow(),
        mkExpertiseRow(),
        mkExpertiseRow()
      );
    }

    var $addExpertiseRow = $('<div>', {class: 'glyphicon glyphicon-plus-sign '})
      .attr({
        tabindex:0,
        "aria-label":"add another expertise record",
        role:"button"
      })
      .click(function() {
        $expertiseTable.append(mkExpertiseRow());
        $expertiseTable.find('.info_row').last().find('input').first().focus()
    });

    return [
      $('<section>').append(
        '<h4>Names</h4>',
        '<p class="instructions">How do you usually write your name as author of a paper? Also add any other names you have authored papers under.</p>',
        $namesTable,
        $addNameRow
      ),

      $('<section>').append(
        '<h4>Gender</h4>',
        '<p class="instructions">This information helps conferences better understand their gender diversity. (Optional)</p>',
        $personalTable
      ),

      $('<section>').append(
        '<h4>Emails</h4>',
        '<p class="instructions">Enter email addresses associated with all of your current ' +
          'and historical institutional affiliations, as well as all your previous publications, ' +
          'and the Toronto Paper Matching System. This information is crucial for deduplicating ' +
          'users, and ensuring you see your reviewing assignments.</p>',
        $emailsTable,
        $addInfoRow
      ),

      $('<section>').append(
        '<h4>Personal Links</h4>',
        '<p class="instructions">Enter full URLs of your public profiles on other sites. All URLs should begin with http or https.</p>',
        $urlTable1
      ),

      $('<section>').append(
        '<h4>Education &amp; Career History</h4>',
        '<p class="instructions">Enter your education and career history. The institution domain is used for conflict of interest detection and institution ranking. For ongoing positions, leave the end field blank.</p>',
        $historyTable,
        $addHistoryRow
      ),

      $('<section>').append(
        '<h4>Advisors &amp; Other Relations</h4>',
        '<p class="instructions">Enter all advisors, co-workers, and other people that should be included when detecting conflicts of interest.</p>',
        $relationTable,
        $addRelationRow
      ),

      $('<section>').append(
        '<h4>Expertise</h4>',
        '<p class="instructions" tabindex="0" role="text">' +
          'For each line, enter comma-separated keyphrases representing an intersection of your interests. Think of each line as a query for papers in which you would have expertise and interest. For example:<br>' +
          '<em>topic models, social network analysis, computational social science</em><br>' +
          '<em>deep learning, RNNs, dependency parsing</em></p>',
        $expertiseTable,
        $addExpertiseRow
      ),

      params.hidePublicationEditor ? null : $('<section>').append(
        '<h4>Publications</h4>',
        '<p class="instructions">Below is a list of all publications on OpenReview that include you as an author. You can remove any publication you are not an author of by clicking the minus button next to the title.</p>',
        $('<div>', { id: 'publication-editor-container' })
      ),
    ];
  };

  var publicationIdsToUnlink;
  var publicationsForPublicationEditor;

  var renderPublicationEditor = async function(profileId) {
    // Publication Editor Section
    var publicationEditorPageSize = 20;

    var loadPublicationsForPublicationEditor = async function(offset) {
      if (process.env.ENABLE_V2_API) {
        if (publicationsForPublicationEditor?.length) {
          // offset won't work with multiple api calls so take a slice of all publications
          return {
            notes: publicationsForPublicationEditor.slice(offset, offset + publicationEditorPageSize),
            count: publicationsForPublicationEditor.length
          }
        }
        var v1NotesP = Webfield.get('/notes', {
          'content.authorids': profileId,
          details: 'invitation,original',
          sort: 'tmdate:desc',
        }, { cache: false });
        var v2NotesP = Webfield.getV2('/notes', {
          'content.authorids': profileId,
          details: 'invitation,original',
          sort: 'tmdate:desc',
        }, { cache: false })

        const results = await Promise.all([v1NotesP, v2NotesP])
        const notes = apiV2MergeNotes(results[0].notes, results[1].notes)
        publicationsForPublicationEditor = notes
        return {
          notes,
          count: notes.length
        }
      } else {
        return await Webfield.get('/notes', {
          'content.authorids': profileId,
          details: 'invitation,original',
          sort: 'tmdate:desc',
          offset: offset,
          limit: publicationEditorPageSize
        }, { cache: false });
      }
    };

    var publicationUnlinkHandler = function() {
      var $li = $(this).closest('li');
      publicationIdsToUnlink.push($li.data('id'));

      $li.addClass('unlinked-publication');
      $(this).replaceWith(
        $('<span>', { class: 'relink-publication glyphicon glyphicon-repeat mirror' })
          .attr({
            tabindex: 0,
            "aria-label": "relink this publication to your profile",
            role: "button"
          })
          .on('click', publicationRelinkHandler)
      );
    };

    var publicationRelinkHandler = function() {
      var $li = $(this).closest('li');
      var dataId = $li.data('id');
      publicationIdsToUnlink = publicationIdsToUnlink.filter(function(id) {
        return id !== dataId;
      });

      $li.removeClass('unlinked-publication');
      $(this).replaceWith(
        $('<span>', { class: 'unlink-publication glyphicon glyphicon-minus-sign' })
          .attr({
            tabindex: 0,
            "aria-label": "unlink this publication from your profile",
            role: "button"
          })
          .on('click', publicationUnlinkHandler)
      );
    };

    var notesResponse = await loadPublicationsForPublicationEditor(0)
    var notes = notesResponse.notes || [];
    var noteCount = notesResponse.count;
    if (!noteCount) {
      $('#publication-editor-container').closest('section').hide();
      return;
    }
    $('#publication-editor-container').closest('section').show();

    var paperDisplayOptions = {
      pdfLink: true,
      showContents: true,
      openInNewTab: true,
      showUnlinkPublicationButton: true
    };
    if(process.env.ENABLE_V2_API){
      Webfield.ui.submissionListV2(notes, {
        heading: null,
        container: '#publication-editor-container',
        search: { enabled: false },
        displayOptions: paperDisplayOptions,
        autoLoad: false,
        noteCount: noteCount,
        pageSize: publicationEditorPageSize,
        fadeIn: false,
        onPageClick: async function (offset) {
          var notesResponse = await loadPublicationsForPublicationEditor(offset);
          return notesResponse.notes;
        },
        onPageClickComplete: function () {
          $('#publication-editor-container li.note').each(function () {
            if (publicationIdsToUnlink.includes($(this).data('id'))) {
              $(this).addClass('unlinked-publication').find('.glyphicon.glyphicon-minus-sign').replaceWith(
                $('<span>', { class: 'relink-publication glyphicon glyphicon-repeat mirror' })
                  .on('click', publicationRelinkHandler)
              );
            }
          });
          $('#publication-editor-container .unlink-publication').on('click', publicationUnlinkHandler);
        },
      });
    } else {
      Webfield.ui.submissionList(notes, {
        heading: null,
        container: '#publication-editor-container',
        search: { enabled: false },
        displayOptions: paperDisplayOptions,
        autoLoad: false,
        noteCount: noteCount,
        pageSize: publicationEditorPageSize,
        fadeIn: false,
        onPageClick: async function (offset) {
          var notesResponse = await loadPublicationsForPublicationEditor(offset);
          return notesResponse.notes;
        },
        onPageClickComplete: function () {
          $('#publication-editor-container li.note').each(function () {
            if (publicationIdsToUnlink.includes($(this).data('id'))) {
              $(this).addClass('unlinked-publication').find('.glyphicon.glyphicon-minus-sign').replaceWith(
                $('<span>', { class: 'relink-publication glyphicon glyphicon-repeat mirror' })
                  .on('click', publicationRelinkHandler)
              );
            }
          });
          $('#publication-editor-container .unlink-publication').on('click', publicationUnlinkHandler);
        },
      });
    }


    // add handler after initial load
    $('#publication-editor-container .unlink-publication').on('click', publicationUnlinkHandler);
  };

  var validateContent = function(content) {
    if (!validateNames(content.names, $('#names_table'))) {
      return false;
    }

    if (!validateEmails(content.emails, $('#emails_table'))) {
      return false;
    }

    var personalLinks = {
      homepage: content.homepage,
      gscholar: content.gscholar,
      dblp: content.dblp,
      orcid: content.orcid,
      linkedin: content.linkedin,
      wikipedia: content.wikipedia,
      semanticScholar: content.semanticScholar,
    };
    if (!validateUrls(personalLinks, $('#url1_table'))) {
      return false;
    }

    var historyDomains = content.history.map(function(history) {
      return history.institution.domain;
    });
    if (!validatePeriodDates(content.history, $('#history_table')) ||
        !validateDomains(historyDomains, $('#history_table')) ||
        !validateMinimunHistory(content.history, $('#history_table'))) {
      return false;
    }

    var relationEmails = content.relations.map(function(relation) {
      return relation.email;
    });
    if (!validatePeriodDates(content.relations, $('#relation_table')) ||
        !validateEmails(relationEmails, $('#relation_table'), 1)) {
      return false;
    }

    if (!validatePeriodDates(content.expertise, $('#expertise_table'))) {
      return false;
    }

    return true;
  };

  var validateNames = function(names, $table) {
    var rows = $table.find('tr');
    var row;

    for (var i = 0; i < names.length; i++) {
      if (!names[i].first || !names[i].last) {
        promptError('First and last name cannot be empty');
        row = rows.eq(i + 1);
        row.find('.first_name').addClass('invalid_value');
        row.find('.last_name').addClass('invalid_value');
        return false;
      }
    }
    return true;
  };

  var validateEmails = function(emails, $table, rowOffset) {
    rowOffset = rowOffset || 0;
    var rows = $table.find('tr');
    var row;

    for (var i = 0; i < emails.length; i++) {
      if (!view.isValidEmail(emails[i])) {
        if (emails[i]) {
          promptError(emails[i] + ' is not a valid email address');
        } else {
          // Special case - only relations table allows empty emails to be validated
          promptError('A valid email address is required for new relations');
        }
        row = rows.eq(i + rowOffset);
        row.find('.email,.relation_email').addClass('invalid_value');

        return false;
      }
    }
    return true;
  };

  var validateUrls = function(personalLinks, $table) {
    // Regex based on https://gist.github.com/dperini/729294 modified to not accept FTP urls
    var urlRegex = /^(?:(?:https?):\/\/)(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
    var allValid = true;
    var oneCompleted = false;

    const domainSpecificValidationMap = {
      'semanticScholar': {
        name: 'Semantic Scholar',
        pattern: 'https://www.semanticscholar.org'
      },
      'gscholar': {
        name: 'Google Scholar',
        pattern: 'https://scholar.google' // can be .com/.co.uk/.hk...
      }
    }

    _.forEach(personalLinks, function(value, key) {
      if (value) {
        oneCompleted = true;
        if (!urlRegex.test(value)) {
          promptError(value + ' is not a valid URL');
          $table.find('#' + key + '_url').addClass('invalid_value');
          allValid = false;
        }
        if (domainSpecificValidationMap[key] && !value.startsWith(domainSpecificValidationMap[key].pattern)) {
          promptError(value + ` is not a valid ${domainSpecificValidationMap[key].name} URL`);
          $table.find('#' + key + '_url').addClass('invalid_value');
          allValid = false;
        }
      }
    });

    if (!oneCompleted) {
      promptError('You must enter at least one personal link');
      $table.find('#homepage_url').addClass('invalid_value');
      allValid = false;
    }

    return allValid;
  };

  var validateDomains = function(domains, $table) {

    var rows = $table.find('tr');
    var row;

    // Regex based on Tim Groeneveld's solution (latest update) from https://stackoverflow.com/questions/10306690/domain-name-validation-with-regex
    // The above will correctly validate iesl.cs.umass.edu et al as in bug report #1079
    var domainRegex = /^(((?!-))(xn--|_{1,1})?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/;

    for (var i = 0; i < domains.length; i++) {
      row = rows.eq(i + 1);
      if (!domains[i]) {
        promptError('Domain is required for all positions');
        row.find('.institution_domain').addClass('invalid_value');
        return false;
      }
      // Regex doesn't check for www subdomain so make sure that isn't included
      if (_.startsWith(domains[i], 'www') || !domainRegex.test(domains[i])) {
        promptError(domains[i] + ' is not a valid domain. Domains should not contain "http", "www", or and special characters like "?" or "/".');
        row.find('.institution_domain').addClass('invalid_value');
        return false;
      }
    }
    return true;
  };

  var validatePeriodDates = function(data, $table) {
    var rows = $table.find('tr');
    var row;

    for (var i = 0; i < data.length; i++) {
      var h = data[i];
      row = rows.eq(i + 1);

      var validYearRegex = /^(19|20)\d{2}$/; // 1900~2099

      if(h.start && !validYearRegex.test(h.start)){
        promptError('Start date should be a valid year');
        row.find('.start').addClass('invalid_value');
        return false;
      }

      if(h.end && !validYearRegex.test(h.end)){
        promptError('End date should be a valid year');
        row.find('.end').addClass('invalid_value');
        return false;
      }

      if (h.start && h.end && h.start > h.end) {
        promptError('End date should be higher than start date');
        row.find('.start').addClass('invalid_value');
        row.find('.end').addClass('invalid_value');
        return false;
      }
      if (!h.start && h.end) {
        promptError('Start date can not be empty');
        row.find('.start').addClass('invalid_value');
        row.find('.end').addClass('invalid_value');
        return false;
      }
    }
    return true;
  };

  var validateMinimunHistory = function(data, $table) {
    var rows = $table.find('tr');
    var row;

    if (!data.length) {
      promptError('You must enter at least one position for your education and career history');
      row = rows.eq(1);
      row.find('.institution_name').addClass('invalid_value');
      row.find('.position').addClass('invalid_value');
      row.find('.institution_domain').addClass('invalid_value');
      return false;
    }
    for (var i = 0; i < data.length; i++) {
      row = rows.eq(i + 1);

      if (!data[i].position || !data[i].institution.name || !data[i].institution.domain) {
        promptError('You must enter position, institution, and domain information for each entry in your education and career history');
        row.find('.institution_name').addClass('invalid_value');
        row.find('.position').addClass('invalid_value');
        row.find('.institution_domain').addClass('invalid_value');
        return false;
      }
    }
    return true;
  };

  var mkProfilePanel = function(profile, params, submitF) {
    var prefixedPositions = params.prefixedPositions;
    var prefixedRelations = params.prefixedRelations;
    var prefixedRelationReaders = params.prefixedRelationReaders;
    var institutions = params.institutions;
    var prefixedInstitutions = institutions.map(function(i) {
      return i.id;
    }).filter(function(i) {
      return !_.isEmpty(i);
    });
    var buttonText = params.submitButtonText;
    publicationIdsToUnlink = [];

    var getNames = function() {
      var list = [];

      $('#names_table').find('.info_row').each(function(index) {
        var self = $(this);
        var firstName = self.find('.first_name').val().trim();
        var middleName = self.find('.middle_name').val().trim();
        var lastName = self.find('.last_name').val().trim();
        var username = self.find('.username').text().trim();
        var preferred  = self.find('.preferred').is(':visible');

        if (firstName || middleName || lastName) {
          list.push({
            first: firstName,
            middle: middleName,
            last: lastName,
            username: username,
            preferred: preferred
          });
        }
      });

      return list;
    };

    var getEmails = function() {
      var list = [];
      var preferredEmail = '';

      $('#emails_table').find('.info_row').each(function() {
        var email = $(this).find('.email').val().trim().toLowerCase();

        if (email) {
          list.push(email);
          if ($(this).find('.preferred').is(':visible')) {
            preferredEmail = email;
          }
        }
      });
      return [list, preferredEmail];
    };

    var getHistory = function() {
      var list = [];
      var $historyTable = $('#history_table');
      $historyTable.find('.info_row').each(function(index) {
        var self = $(this);
        var position = self.find('.position').val().trim();
        var institutionName = self.find('.institution_name').val().trim();
        var institutionDomain = self.find('.institution_domain').val().trim();

        if (position || institutionDomain || institutionName) {
          list.push({
            position: position,
            start: Number(self.find('.start').val().trim()) || null,
            end: Number(self.find('.end').val().trim()) || null,
            institution: {
              domain: institutionDomain && institutionDomain.toLowerCase(),
              name: institutionName
            }
          });
        }

      });

      return list;
    };

    var getRelations = function() {
      var list = [];
      var $relationTable = $('#relation_table');
      $relationTable.find('.info_row').each(function(index) {
        var self = $(this);
        var relation = self.find('.relation').val().trim();

        if (relation) {
          list.push({
            name: self.find('.relation_name').val().trim() || null,
            email: self.find('.relation_email').val().trim().toLowerCase(),
            relation: relation,
            start: Number(self.find('.start').val().trim()) || null,
            end: Number(self.find('.end').val().trim()) || null,
            readers: self.find('.multiselector').data('val')
          });
        }

      });

      return list;
    };

    var getExpertise = function() {
      var list = [];
      var $expertiseTable = $('#expertise_table');
      $expertiseTable.find('.info_row').each(function(index) {
        var self = $(this);
        var expertise = self.find('.expertise').val().trim();
        if (expertise) {
          list.push({
            keywords: expertise.split(',').map(function(item) { return item.trim(); }),
            start: Number(self.find('.start').val().trim()) || null,
            end: Number(self.find('.end').val().trim()) || null
          });
        }
      });
      return list;
    };

    var getGender = function() {
      var $personalTable = $('#personal_table');
      var gender = $personalTable.find('.gender').val().trim();
      return gender;
    };

    var getContent = function() {
      var namesData = getNames();
      var gender = getGender();
      var historyData = getHistory();
      var relationData = getRelations();
      var expertiseData = getExpertise();
      var emailData = getEmails();
      var $urlTable = $('#url1_table');

      return {
        names: namesData,
        gender: gender,
        homepage: $urlTable.find('#homepage_url').val().trim(),
        gscholar: $urlTable.find('#gscholar_url').val().trim(),
        dblp: $urlTable.find('#dblp_url').val().trim(),
        orcid: $urlTable.find('#orcid_url').val().trim(),
        linkedin: $urlTable.find('#linkedin_url').val().trim(),
        wikipedia: $urlTable.find('#wikipedia_url').val().trim(),
        semanticScholar : $urlTable.find('#semanticScholar_url').val().trim(),
        emails: emailData[0],
        preferredEmail: emailData[1],
        history: historyData,
        relations: relationData,
        expertise: expertiseData
      };
    };


    var $mainView = $('<div>', {class: 'profile-edit-container'});
    var $panel = drawView(profile, prefixedPositions, prefixedInstitutions, institutions, prefixedRelations, prefixedRelationReaders);
    renderPublicationEditor(profile.id);

    var $submitButton = $('<button class="btn">' + buttonText + '</button>').click(function() {

      $('.profile-edit-container .invalid_value').removeClass('invalid_value');
      var newContent = getContent();

      if (!validateContent(newContent)) {
        return false;
      }

      newContent.history.sort(periodSorter);
      newContent.relations.sort(periodSorter);
      newContent.expertise.sort(periodSorter);
      newContent.publicationIdsToUnlink = publicationIdsToUnlink;

      var newProfile = _.assign(profile, { content: newContent });

      $submitButton.prop({ disabled: true }).append([
        '<div class="spinner-small">',
          '<div class="rect1"></div><div class="rect2"></div>',
          '<div class="rect3"></div><div class="rect4"></div>',
        '</div>'
      ].join('\n'));
      if ($cancelButton) {
        $cancelButton.prop({ disabled: true });
      }
      submitF(newProfile, function() {
        $submitButton.prop({ disabled: false }).find('.spinner-small').remove();
        if ($cancelButton) {
          $cancelButton.prop({ disabled: false });
        }
      });
      return true;
    });

    var $cancelButton = params.hideCancelButton ? null : $('<button class="btn btn-default">Cancel</button>').click(function() {
      var $newPanel = drawView(profile, prefixedPositions, prefixedInstitutions, institutions);
      $mainView.empty().append($newPanel);
      $panel = $newPanel;

      if (cancelF) {
        cancelF();
      }
    });

    var canExit = function() {
      var newContent = getContent();
      var hasChanges = !_.isEqual(
        _.omit(profile.content, ['password', 'emailsConfirmed']),
        newContent
      );

      if (params.activation && hasChanges) {
        promptError('You must save your profile changes to active your account');
        return false;
      }
      if (hasChanges) {
        promptError('You must first save or cancel your profile changes');
        return false;
      }
      return true;
    };

    $mainView.append($panel, $submitButton, $cancelButton);

    return {
      view: $mainView,
      canExit: canExit,
      renderPublicationEditor: renderPublicationEditor
    };
  };

  var profileController = mkProfilePanel(profile, params, submitF);

  return profileController;
};
