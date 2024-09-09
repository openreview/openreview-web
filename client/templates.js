(function() {
  var template = Handlebars.template, templates = window.Handlebars.templates = window.Handlebars.templates || {};
templates['committeeSummary'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <h4><a href=\"/profile?id="
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":3,"column":29},"end":{"line":3,"column":35}}}) : helper)))
    + "\" target=\"_blank\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data,"loc":{"start":{"line":3,"column":53},"end":{"line":3,"column":61}}}) : helper)))
    + "</a></h4>\n    <p class=\"text-muted\">("
    + alias4(((helper = (helper = lookupProperty(helpers,"email") || (depth0 != null ? lookupProperty(depth0,"email") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"email","hash":{},"data":data,"loc":{"start":{"line":4,"column":27},"end":{"line":4,"column":36}}}) : helper)))
    + ")</p>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <h4><a href=\"/profile?email="
    + alias4(((helper = (helper = lookupProperty(helpers,"email") || (depth0 != null ? lookupProperty(depth0,"email") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"email","hash":{},"data":data,"loc":{"start":{"line":6,"column":32},"end":{"line":6,"column":41}}}) : helper)))
    + "\" target=\"_blank\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"email") || (depth0 != null ? lookupProperty(depth0,"email") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"email","hash":{},"data":data,"loc":{"start":{"line":6,"column":59},"end":{"line":6,"column":68}}}) : helper)))
    + "</a></h4>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      Completed Bids: "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"completedBids") || (depth0 != null ? lookupProperty(depth0,"completedBids") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"completedBids","hash":{},"data":data,"loc":{"start":{"line":11,"column":22},"end":{"line":11,"column":39}}}) : helper)))
    + "&nbsp;\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"completedBids") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":12,"column":6},"end":{"line":14,"column":13}}})) != null ? stack1 : "")
    + "      <br>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        (<a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"edgeBrowserBidsUrl") || (depth0 != null ? lookupProperty(depth0,"edgeBrowserBidsUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"edgeBrowserBidsUrl","hash":{},"data":data,"loc":{"start":{"line":13,"column":18},"end":{"line":13,"column":40}}}) : helper)))
    + "\" class=\"show-reviewer-bids\" target=\"_blank\">view all</a>)\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      Reviewers Recommended: "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"completedRecs") || (depth0 != null ? lookupProperty(depth0,"completedRecs") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"completedRecs","hash":{},"data":data,"loc":{"start":{"line":19,"column":29},"end":{"line":19,"column":46}}}) : helper)))
    + "&nbsp;\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"completedRecs") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":20,"column":6},"end":{"line":22,"column":13}}})) != null ? stack1 : "");
},"9":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        (<a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"edgeBrowserRecsUrl") || (depth0 != null ? lookupProperty(depth0,"edgeBrowserRecsUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"edgeBrowserRecsUrl","hash":{},"data":data,"loc":{"start":{"line":21,"column":18},"end":{"line":21,"column":40}}}) : helper)))
    + "\" class=\"show-reviewer-bids\" target=\"_blank\">view all</a>)\n";
},"11":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      Reviewer Assignments:\n      <a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"edgeBrowserAssignmentUrl") || (depth0 != null ? lookupProperty(depth0,"edgeBrowserAssignmentUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"edgeBrowserAssignmentUrl","hash":{},"data":data,"loc":{"start":{"line":27,"column":15},"end":{"line":27,"column":43}}}) : helper)))
    + "\" class=\"show-reviewer-assignments\" target=\"_blank\">View all</a>\n";
},"13":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"status") : depth0),{"name":"each","hash":{},"fn":container.program(14, data, 2, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":31,"column":6},"end":{"line":34,"column":15}}})) != null ? stack1 : "");
},"14":function(container,depth0,helpers,partials,data,blockParams) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "        <br>\n        "
    + alias2(alias1(blockParams[0][1], depth0))
    + ": "
    + alias2(alias1(blockParams[0][0], depth0))
    + "\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"note\" data-id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"id","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":1,"column":27},"end":{"line":1,"column":33}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"name") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams),"inverse":container.program(3, data, 0, blockParams),"data":data,"blockParams":blockParams,"loc":{"start":{"line":2,"column":2},"end":{"line":7,"column":9}}})) != null ? stack1 : "")
    + "\n  <p>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"showBids") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":10,"column":4},"end":{"line":16,"column":11}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"showRecommendations") : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":18,"column":4},"end":{"line":23,"column":11}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"edgeBrowserAssignmentUrl") : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":25,"column":4},"end":{"line":28,"column":11}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"status") : depth0),{"name":"if","hash":{},"fn":container.program(13, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":30,"column":4},"end":{"line":35,"column":11}}})) != null ? stack1 : "")
    + "  </p>\n</div>\n";
},"useData":true,"useBlockParams":true});
templates['genericModal'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class=\"modal-header\">\n          <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n          <h3 class=\"modal-title\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"data":data,"loc":{"start":{"line":7,"column":34},"end":{"line":7,"column":43}}}) : helper)))
    + "</h3>\n        </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class=\"modal-footer\">\n          <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Cancel</button>\n          <button type=\"button\" class=\"btn btn-primary\">"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"primaryButtonText") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(6, data, 0),"data":data,"loc":{"start":{"line":18,"column":56},"end":{"line":18,"column":123}}})) != null ? stack1 : "")
    + "</button>\n        </div>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"primaryButtonText") || (depth0 != null ? lookupProperty(depth0,"primaryButtonText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"primaryButtonText","hash":{},"data":data,"loc":{"start":{"line":18,"column":81},"end":{"line":18,"column":102}}}) : helper)));
},"6":function(container,depth0,helpers,partials,data) {
    return "Submit";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":1,"column":9},"end":{"line":1,"column":15}}}) : helper)))
    + "\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\">\n  <div class=\"modal-dialog "
    + alias4(((helper = (helper = lookupProperty(helpers,"extraClasses") || (depth0 != null ? lookupProperty(depth0,"extraClasses") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"extraClasses","hash":{},"data":data,"loc":{"start":{"line":2,"column":27},"end":{"line":2,"column":43}}}) : helper)))
    + "\">\n    <div class=\"modal-content\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"showHeader") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":4,"column":6},"end":{"line":9,"column":13}}})) != null ? stack1 : "")
    + "\n      <div class=\"modal-body\">\n        "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"body") || (depth0 != null ? lookupProperty(depth0,"body") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"body","hash":{},"data":data,"loc":{"start":{"line":12,"column":8},"end":{"line":12,"column":18}}}) : helper))) != null ? stack1 : "")
    + "\n      </div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"showFooter") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":15,"column":6},"end":{"line":20,"column":13}}})) != null ? stack1 : "")
    + "    </div>\n  </div>\n</div>\n";
},"useData":true});
templates['invitationButton'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "    <strong class=\"item hint\">Add:</strong>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <span class=\"item hint\">Add:</span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"panel\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"largeLabel") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":2,"column":2},"end":{"line":6,"column":9}}})) != null ? stack1 : "")
    + "  <button class=\"btn\">"
    + container.escapeExpression((lookupProperty(helpers,"prettyId")||(depth0 && lookupProperty(depth0,"prettyId"))||container.hooks.helperMissing).call(alias1,(depth0 != null ? lookupProperty(depth0,"invitationId") : depth0),{"name":"prettyId","hash":{},"data":data,"loc":{"start":{"line":7,"column":22},"end":{"line":7,"column":47}}}))
    + "</button>\n</div>\n";
},"useData":true});
templates['messageReviewersModal'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "          You may customize the message the reviewer will be sent below.\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "          Select the group of reviewers to send a reminder email to and customize the message if required.\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "data-forum-url=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"forumUrl") || (depth0 != null ? lookupProperty(depth0,"forumUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"forumUrl","hash":{},"data":data,"loc":{"start":{"line":19,"column":95},"end":{"line":19,"column":107}}}) : helper)))
    + "\"";
},"7":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <div class=\"form-group\">\n              <label for=\"userId\">Reviewer</label>\n              <input type=\"text\" name=\"userId\" class=\"form-control\" value=\""
    + container.escapeExpression((lookupProperty(helpers,"prettyId")||(depth0 && lookupProperty(depth0,"prettyId"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"reviewerId") : depth0),{"name":"prettyId","hash":{},"data":data,"loc":{"start":{"line":23,"column":75},"end":{"line":23,"column":98}}}))
    + "\" disabled=\"disabled\">\n            </div>\n";
},"9":function(container,depth0,helpers,partials,data) {
    return "            <div class=\"form-group\">\n              <label for=\"group\">Reviewer Group</label>\n              <select name=\"group\" class=\"form-control\">\n                <option value=\"all\">All reviewers</option>\n                <option value=\"selected\">Just reviewers of selected papers</option>\n              </select>\n            </div>\n\n            <div class=\"form-group\">\n              <label for=\"filter\">Send To</label>\n              <select name=\"filter\" class=\"form-control\">\n                <option value=\"both\">All</option>\n                <option value=\"unsubmitted\">Reviewers with unsubmitted reviews</option>\n                <option value=\"submitted\">Reviewers who have completed a review</option>\n              </select>\n            </div>\n";
},"11":function(container,depth0,helpers,partials,data) {
    return "        <div class=\"modal-body step-2\" style=\"display: none;\">\n          <p>A total of <span class=\"num-reviewers\"></span> reminder emails will be sent to the following reviewers:</p>\n          <div class=\"well reviewer-list\"></div>\n        </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id=\"message-reviewers-modal\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\" >\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n        <h3 class=\"modal-title\">Send Reminder Message</h3>\n      </div>\n\n      <div class=\"modal-body step-1\">\n        <p>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"singleRecipient") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":11,"column":10},"end":{"line":15,"column":17}}})) != null ? stack1 : "")
    + "          In the email body, the text [[SUBMIT_REVIEW_LINK]] will be replaced with a hyperlink to the form\n          where the reviewer can fill out his or her review.\n        </p>\n        <form id=\"message-reviewers-form\" method=\"POST\" "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"singleRecipient") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":19,"column":56},"end":{"line":19,"column":115}}})) != null ? stack1 : "")
    + ">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"singleRecipient") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(9, data, 0),"data":data,"loc":{"start":{"line":20,"column":10},"end":{"line":42,"column":17}}})) != null ? stack1 : "")
    + "\n          <div class=\"form-group\">\n            <label for=\"subject\">Email Subject</label>\n            <input type=\"text\" name=\"subject\" class=\"form-control\" placeholder=\"Subject\" value=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"defaultSubject") || (depth0 != null ? lookupProperty(depth0,"defaultSubject") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"defaultSubject","hash":{},"data":data,"loc":{"start":{"line":46,"column":96},"end":{"line":46,"column":114}}}) : helper)))
    + "\" required>\n          </div>\n\n          <div class=\"form-group\">\n            <label for=\"message\">Email Body</label>\n            <textarea name=\"message\" class=\"form-control feedback-input\" rows=\"6\" placeholder=\"Message\" required>"
    + alias4(((helper = (helper = lookupProperty(helpers,"defaultBody") || (depth0 != null ? lookupProperty(depth0,"defaultBody") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"defaultBody","hash":{},"data":data,"loc":{"start":{"line":51,"column":113},"end":{"line":51,"column":128}}}) : helper)))
    + "</textarea>\n          </div>\n        </form>\n      </div>\n\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"singleRecipient") : depth0),{"name":"unless","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":56,"column":6},"end":{"line":61,"column":17}}})) != null ? stack1 : "")
    + "\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Cancel</button>\n        <button type=\"button\" class=\"btn btn-primary step-1\">Next</button>\n        <button type=\"button\" class=\"btn btn-primary step-2\" style=\"display: none;\">Confirm & Send Messages</button>\n      </div>\n    </div>\n  </div>\n</div>\n";
},"useData":true});
templates['messageReviewersModalFewerOptions'] = template({"1":function(container,depth0,helpers,partials,data) {
    return " All Reviewers of Selected Papers";
},"3":function(container,depth0,helpers,partials,data) {
    return " Reviewers of Selected Papers with Submitted Reviews";
},"5":function(container,depth0,helpers,partials,data) {
    return " Reviewers of Selected Papers with Unsubmitted Reviews";
},"7":function(container,depth0,helpers,partials,data) {
    return "reviewer";
},"9":function(container,depth0,helpers,partials,data) {
    return "reviewers";
},"11":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "data-forum-url=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"forumUrl") || (depth0 != null ? lookupProperty(depth0,"forumUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"forumUrl","hash":{},"data":data,"loc":{"start":{"line":18,"column":95},"end":{"line":18,"column":107}}}) : helper)))
    + "\"";
},"13":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <div class=\"form-group\">\n              <label for=\"userId\">Reviewer</label>\n              <input type=\"text\" name=\"userId\" class=\"form-control\" value=\""
    + container.escapeExpression((lookupProperty(helpers,"prettyId")||(depth0 && lookupProperty(depth0,"prettyId"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"reviewerId") : depth0),{"name":"prettyId","hash":{},"data":data,"loc":{"start":{"line":22,"column":75},"end":{"line":22,"column":98}}}))
    + "\" disabled=\"disabled\">\n            </div>\n";
},"15":function(container,depth0,helpers,partials,data) {
    return "        <div class=\"modal-body step-2\" style=\"display: none;\">\n          <p>A total of <span class=\"num-reviewers\"></span> reminder emails will be sent to the following reviewers:</p>\n          <div class=\"well reviewer-list\"></div>\n        </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id=\"message-reviewers-modal\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\" >\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n        <h3 class=\"modal-title\">Message\n          "
    + ((stack1 = (lookupProperty(helpers,"is")||(depth0 && lookupProperty(depth0,"is"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"filter") : depth0),"msg-all-reviewers",{"name":"is","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":7,"column":10},"end":{"line":7,"column":84}}})) != null ? stack1 : "")
    + "\n          "
    + ((stack1 = (lookupProperty(helpers,"is")||(depth0 && lookupProperty(depth0,"is"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"filter") : depth0),"msg-submitted-reviewers",{"name":"is","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":8,"column":10},"end":{"line":8,"column":109}}})) != null ? stack1 : "")
    + "\n          "
    + ((stack1 = (lookupProperty(helpers,"is")||(depth0 && lookupProperty(depth0,"is"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"filter") : depth0),"msg-unsubmitted-reviewers",{"name":"is","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":9,"column":10},"end":{"line":9,"column":113}}})) != null ? stack1 : "")
    + "\n        </h3>\n      </div>\n      <div class=\"modal-body step-1\">\n        <p>\n          You may customize the message that will be sent to the "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"singleRecipient") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(9, data, 0),"data":data,"loc":{"start":{"line":14,"column":65},"end":{"line":14,"column":120}}})) != null ? stack1 : "")
    + ".\n          In the email body, the text [[SUBMIT_REVIEW_LINK]] will be replaced with a hyperlink to the form\n          where the reviewer can fill out his or her review.\n        </p>\n        <form id=\"message-reviewers-form\" method=\"POST\" "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"singleRecipient") : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":56},"end":{"line":18,"column":115}}})) != null ? stack1 : "")
    + ">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"singleRecipient") : depth0),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":19,"column":10},"end":{"line":24,"column":17}}})) != null ? stack1 : "")
    + "\n          <div class=\"form-group\">\n            <label for=\"subject\">Email Subject</label>\n            <input type=\"text\" name=\"subject\" class=\"form-control\" placeholder=\"Subject\" value=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"defaultSubject") || (depth0 != null ? lookupProperty(depth0,"defaultSubject") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"defaultSubject","hash":{},"data":data,"loc":{"start":{"line":28,"column":96},"end":{"line":28,"column":114}}}) : helper)))
    + "\" required>\n          </div>\n\n          <div class=\"form-group\">\n            <label for=\"message\">Email Body</label>\n            <textarea name=\"message\" class=\"form-control feedback-input\" rows=\"6\" placeholder=\"Message\" required>"
    + alias4(((helper = (helper = lookupProperty(helpers,"defaultBody") || (depth0 != null ? lookupProperty(depth0,"defaultBody") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"defaultBody","hash":{},"data":data,"loc":{"start":{"line":33,"column":113},"end":{"line":33,"column":128}}}) : helper)))
    + "</textarea>\n          </div>\n        </form>\n      </div>\n\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"singleRecipient") : depth0),{"name":"unless","hash":{},"fn":container.program(15, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":38,"column":6},"end":{"line":43,"column":17}}})) != null ? stack1 : "")
    + "\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Cancel</button>\n        <button type=\"button\" class=\"btn btn-primary step-1\" data-filter=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"filter") || (depth0 != null ? lookupProperty(depth0,"filter") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"filter","hash":{},"data":data,"loc":{"start":{"line":47,"column":74},"end":{"line":47,"column":84}}}) : helper)))
    + "\">Next</button>\n        <button type=\"button\" class=\"btn btn-primary step-2\" style=\"display: none;\">Confirm &amp; Send Messages</button>\n      </div>\n    </div>\n  </div>\n</div>\n";
},"useData":true});
templates['noteAreaChairs'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"metaReviewName") || (depth0 != null ? lookupProperty(depth0,"metaReviewName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"metaReviewName","hash":{},"data":data,"loc":{"start":{"line":2,"column":46},"end":{"line":2,"column":64}}}) : helper)));
},"3":function(container,depth0,helpers,partials,data) {
    return "Meta Review";
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"committeeName") || (depth0 != null ? lookupProperty(depth0,"committeeName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"committeeName","hash":{},"data":data,"loc":{"start":{"line":4,"column":31},"end":{"line":4,"column":48}}}) : helper)));
},"7":function(container,depth0,helpers,partials,data) {
    return "Area Chair";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <tr>\n          <td style=\"width: "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"tableWidth") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"data":data,"loc":{"start":{"line":9,"column":28},"end":{"line":9,"column":81}}})) != null ? stack1 : "")
    + "\">\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"areachair") : depth0)) != null ? lookupProperty(stack1,"name") : stack1), depth0))
    + " "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"showPreferredEmail") : depth0),{"name":"if","hash":{},"fn":container.program(14, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":10,"column":31},"end":{"line":10,"column":205}}})) != null ? stack1 : "")
    + "\n          </td>\n        </tr>\n";
},"10":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"tableWidth") || (depth0 != null ? lookupProperty(depth0,"tableWidth") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"tableWidth","hash":{},"data":data,"loc":{"start":{"line":9,"column":46},"end":{"line":9,"column":60}}}) : helper)));
},"12":function(container,depth0,helpers,partials,data) {
    return "320px;";
},"14":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"areachair") : depth0)) != null ? lookupProperty(stack1,"id") : stack1),{"name":"if","hash":{},"fn":container.program(15, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":10,"column":57},"end":{"line":10,"column":198}}})) != null ? stack1 : "");
},"15":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<a href=\"#\" class=\"copy-email\"  data-user-id=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"areachair") : depth0)) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\" data-user-name=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"areachair") : depth0)) != null ? lookupProperty(stack1,"name") : stack1), depth0))
    + "\">Copy Email</a>";
},"17":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <tr>\n          <td>\n            Recommendation: "
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"metaReview") : depth0)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"recommendation") : stack1), depth0))
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depth0 != null ? lookupProperty(depth0,"status") : depth0),{"name":"if","hash":{},"fn":container.program(18, data, 0, blockParams),"inverse":container.program(21, data, 0, blockParams),"data":data,"blockParams":blockParams,"loc":{"start":{"line":18,"column":12},"end":{"line":26,"column":19}}})) != null ? stack1 : "")
    + "          </td>\n        </tr>\n\n        <tr>\n          <td>\n            <a href=\"/forum?id="
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"metaReview") : depth0)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + "&noteId="
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"metaReview") : depth0)) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depth0 != null ? lookupProperty(depth0,"referrer") : depth0),{"name":"if","hash":{},"fn":container.program(24, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":32,"column":76},"end":{"line":32,"column":121}}})) != null ? stack1 : "")
    + "\" target=\"_blank\">Read "
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depth0 != null ? lookupProperty(depth0,"metaReviewName") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams),"inverse":container.program(3, data, 0, blockParams),"data":data,"blockParams":blockParams,"loc":{"start":{"line":32,"column":144},"end":{"line":32,"column":210}}})) != null ? stack1 : "")
    + "</a>\n          </td>\n        </tr>\n";
},"18":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"status") : depth0),{"name":"each","hash":{},"fn":container.program(19, data, 2, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":19,"column":14},"end":{"line":22,"column":23}}})) != null ? stack1 : "");
},"19":function(container,depth0,helpers,partials,data,blockParams) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "                <br>\n                "
    + alias2(alias1(blockParams[0][1], depth0))
    + ": "
    + alias2(alias1(blockParams[0][0], depth0))
    + "\n";
},"21":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              <!-- Deprecated -->\n              "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"metaReview") : depth0)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"format") : stack1),{"name":"if","hash":{},"fn":container.program(22, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":25,"column":14},"end":{"line":25,"column":93}}})) != null ? stack1 : "")
    + "\n";
},"22":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "/ Format: "
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"metaReview") : depth0)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"format") : stack1), depth0));
},"24":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&referrer="
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"referrer") || (depth0 != null ? lookupProperty(depth0,"referrer") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"referrer","hash":{},"data":data,"loc":{"start":{"line":32,"column":102},"end":{"line":32,"column":114}}}) : helper)));
},"26":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <strong>Senior Area Chair:</strong>\n    <table class=\"table table-condensed table-minimal\">\n      <tbody>\n        <tr>\n          <td style=\"width: "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"tableWidth") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"data":data,"loc":{"start":{"line":44,"column":28},"end":{"line":44,"column":81}}})) != null ? stack1 : "")
    + "\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"seniorAreaChair") : depth0)) != null ? lookupProperty(stack1,"name") : stack1), depth0))
    + " <span class=\"text-muted\">("
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"seniorAreaChair") : depth0)) != null ? lookupProperty(stack1,"email") : stack1), depth0))
    + ")</span></td>\n        </tr>\n      </tbody>\n    </table>\n";
},"28":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <br>\n      <a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"url") || (depth0 != null ? lookupProperty(depth0,"url") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"url","hash":{},"data":data,"loc":{"start":{"line":53,"column":15},"end":{"line":53,"column":22}}}) : helper)))
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]),{"name":"if","hash":{},"fn":container.program(29, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":53,"column":22},"end":{"line":53,"column":73}}})) != null ? stack1 : "")
    + "\" target=\"_blank\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data,"loc":{"start":{"line":53,"column":91},"end":{"line":53,"column":99}}}) : helper)))
    + "</a>\n";
},"29":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&referrer="
    + container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]), depth0));
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"areachair-progress\">\n  <h4>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"numMetaReview") || (depth0 != null ? lookupProperty(depth0,"numMetaReview") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"numMetaReview","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":2,"column":6},"end":{"line":2,"column":23}}}) : helper)))
    + " "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"metaReviewName") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.program(3, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":2,"column":24},"end":{"line":2,"column":90}}})) != null ? stack1 : "")
    + " Submitted</h4>\n\n  <strong>"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"committeeName") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0, blockParams, depths),"inverse":container.program(7, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":4,"column":10},"end":{"line":4,"column":73}}})) != null ? stack1 : "")
    + ":</strong>\n  <table class=\"table table-condensed table-minimal\">\n    <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"areachair") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":7,"column":6},"end":{"line":13,"column":13}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"metaReview") : depth0),{"name":"if","hash":{},"fn":container.program(17, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":14,"column":6},"end":{"line":35,"column":13}}})) != null ? stack1 : "")
    + "    </tbody>\n  </table>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"seniorAreaChair") : depth0),{"name":"if","hash":{},"fn":container.program(26, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":39,"column":2},"end":{"line":48,"column":9}}})) != null ? stack1 : "")
    + "\n  <div>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"actions") : depth0),{"name":"each","hash":{},"fn":container.program(28, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":51,"column":4},"end":{"line":54,"column":13}}})) != null ? stack1 : "")
    + "  </div>\n</div>\n";
},"useData":true,"useDepths":true,"useBlockParams":true});
templates['noteMetaReviewStatus'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <h4>"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"committeeName") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":3,"column":8},"end":{"line":3,"column":63}}})) != null ? stack1 : "")
    + " Recommendation:</h4>\n    <p>\n      <strong>"
    + alias4(((helper = (helper = lookupProperty(helpers,"recommendation") || (depth0 != null ? lookupProperty(depth0,"recommendation") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"recommendation","hash":{},"data":data,"loc":{"start":{"line":5,"column":14},"end":{"line":5,"column":32}}}) : helper)))
    + "</strong>\n    </p>\n    <p>\n      <a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"editUrl") || (depth0 != null ? lookupProperty(depth0,"editUrl") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"editUrl","hash":{},"data":data,"loc":{"start":{"line":8,"column":15},"end":{"line":8,"column":26}}}) : helper)))
    + "\" target=\"_blank\">Read"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"invitationUrl") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":8,"column":48},"end":{"line":8,"column":81}}})) != null ? stack1 : "")
    + "</a>\n    </p>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"committeeName") || (depth0 != null ? lookupProperty(depth0,"committeeName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"committeeName","hash":{},"data":data,"loc":{"start":{"line":3,"column":29},"end":{"line":3,"column":46}}}) : helper)));
},"4":function(container,depth0,helpers,partials,data) {
    return "AC";
},"6":function(container,depth0,helpers,partials,data) {
    return "/Edit";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <h4>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"invitationUrl") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(11, data, 0),"data":data,"loc":{"start":{"line":12,"column":6},"end":{"line":16,"column":13}}})) != null ? stack1 : "")
    + "    </h4>\n";
},"9":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"invitationUrl") || (depth0 != null ? lookupProperty(depth0,"invitationUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"invitationUrl","hash":{},"data":data,"loc":{"start":{"line":13,"column":17},"end":{"line":13,"column":34}}}) : helper)))
    + "\" target=\"_blank\">Submit</a>\n";
},"11":function(container,depth0,helpers,partials,data) {
    return "        <strong>No Recommendation</strong>\n";
},"13":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <strong>Reviewer Ratings"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"reviewerRatings") : depth0),{"name":"unless","hash":{},"fn":container.program(14, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":21,"column":28},"end":{"line":21,"column":92}}})) != null ? stack1 : "")
    + ":</strong>\n    <ul class=\"list-unstyled\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"reviewerRatings") : depth0),{"name":"each","hash":{},"fn":container.program(16, data, 2, blockParams, depths),"inverse":container.program(18, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":23,"column":6},"end":{"line":27,"column":15}}})) != null ? stack1 : "")
    + "    </ul>\n";
},"14":function(container,depth0,helpers,partials,data) {
    return " <span>(Incomplete)</span>";
},"16":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <li><strong>Reviewer "
    + alias2(alias1(blockParams[0][1], depth0))
    + ":</strong> "
    + alias2(alias1(blockParams[0][0], depth0))
    + " / "
    + alias2(alias1((depths[1] != null ? lookupProperty(depths[1],"ratingMax") : depths[1]), depth0))
    + "</li>\n";
},"18":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <li><a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"ratingUrl") || (depth0 != null ? lookupProperty(depth0,"ratingUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"ratingUrl","hash":{},"data":data,"loc":{"start":{"line":26,"column":21},"end":{"line":26,"column":34}}}) : helper)))
    + "\" target=\"_blank\">Enter Reviewer Ratings</a></li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"paperNumber") || (depth0 != null ? lookupProperty(depth0,"paperNumber") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"paperNumber","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":1,"column":9},"end":{"line":1,"column":24}}}) : helper)))
    + "-metareview-status\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"recommendation") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.program(8, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":2,"column":2},"end":{"line":18,"column":9}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"ratingUrl") : depth0),{"name":"if","hash":{},"fn":container.program(13, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":20,"column":2},"end":{"line":29,"column":9}}})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true,"useDepths":true,"useBlockParams":true});
templates['noteReviewStatus'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <h4>Your Ratings:</h4>\n    <p>"
    + alias4(((helper = (helper = lookupProperty(helpers,"paperRating") || (depth0 != null ? lookupProperty(depth0,"paperRating") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"paperRating","hash":{},"data":data,"loc":{"start":{"line":4,"column":7},"end":{"line":4,"column":22}}}) : helper)))
    + "</p>\n    <h4>Your Review:</h4>\n    <p>"
    + alias4(((helper = (helper = lookupProperty(helpers,"review") || (depth0 != null ? lookupProperty(depth0,"review") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"review","hash":{},"data":data,"loc":{"start":{"line":6,"column":7},"end":{"line":6,"column":17}}}) : helper)))
    + "</p>\n    <p>\n      <a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"editUrl") || (depth0 != null ? lookupProperty(depth0,"editUrl") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"editUrl","hash":{},"data":data,"loc":{"start":{"line":8,"column":15},"end":{"line":8,"column":26}}}) : helper)))
    + "\" target=\"_blank\">Edit "
    + alias4(((helper = (helper = lookupProperty(helpers,"invitationName") || (depth0 != null ? lookupProperty(depth0,"invitationName") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"invitationName","hash":{},"data":data,"loc":{"start":{"line":8,"column":49},"end":{"line":8,"column":67}}}) : helper)))
    + "</a>\n    </p>\n  ";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"invitationUrl") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":10,"column":10},"end":{"line":12,"column":9}}})) != null ? stack1 : "");
},"4":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n    <h4><a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"invitationUrl") || (depth0 != null ? lookupProperty(depth0,"invitationUrl") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"invitationUrl","hash":{},"data":data,"loc":{"start":{"line":11,"column":17},"end":{"line":11,"column":34}}}) : helper)))
    + "\" target=\"_blank\">Submit "
    + alias4(((helper = (helper = lookupProperty(helpers,"invitationName") || (depth0 != null ? lookupProperty(depth0,"invitationName") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"invitationName","hash":{},"data":data,"loc":{"start":{"line":11,"column":59},"end":{"line":11,"column":77}}}) : helper)))
    + "</a></h4>\n  ";
},"6":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <strong>Reviewer Ratings"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"reviewerRatings") : depth0),{"name":"unless","hash":{},"fn":container.program(7, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":15,"column":26},"end":{"line":15,"column":90}}})) != null ? stack1 : "")
    + ":</strong>\n  <ul class=\"list-unstyled\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"reviewerRatings") : depth0),{"name":"each","hash":{},"fn":container.program(9, data, 2, blockParams, depths),"inverse":container.program(11, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":17,"column":4},"end":{"line":21,"column":13}}})) != null ? stack1 : "")
    + "  </ul>\n";
},"7":function(container,depth0,helpers,partials,data) {
    return " <span>(Incomplete)</span>";
},"9":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <li><strong>Reviewer "
    + alias2(alias1(blockParams[0][1], depth0))
    + ":</strong> "
    + alias2(alias1(blockParams[0][0], depth0))
    + " / "
    + alias2(alias1((depths[1] != null ? lookupProperty(depths[1],"ratingMax") : depths[1]), depth0))
    + "</li>\n";
},"11":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <li><a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"ratingUrl") || (depth0 != null ? lookupProperty(depth0,"ratingUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"ratingUrl","hash":{},"data":data,"loc":{"start":{"line":20,"column":19},"end":{"line":20,"column":32}}}) : helper)))
    + "\" target=\"_blank\">Enter Reviewer Ratings</a></li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"editUrl") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.program(3, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":2,"column":2},"end":{"line":12,"column":16}}})) != null ? stack1 : "")
    + "\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"ratingUrl") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":14,"column":2},"end":{"line":23,"column":9}}})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true,"useDepths":true,"useBlockParams":true});
templates['noteReviewers'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h4>"
    + alias4(((helper = (helper = lookupProperty(helpers,"numSubmittedRecommendations") || (depth0 != null ? lookupProperty(depth0,"numSubmittedRecommendations") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numSubmittedRecommendations","hash":{},"data":data,"loc":{"start":{"line":3,"column":41},"end":{"line":3,"column":72}}}) : helper)))
    + " of "
    + alias4(((helper = (helper = lookupProperty(helpers,"numReviewers") || (depth0 != null ? lookupProperty(depth0,"numReviewers") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numReviewers","hash":{},"data":data,"loc":{"start":{"line":3,"column":76},"end":{"line":3,"column":92}}}) : helper)))
    + " Recommendations Submitted</h4>";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <a href=\"#"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"noteId") || (depth0 != null ? lookupProperty(depth0,"noteId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"noteId","hash":{},"data":data,"loc":{"start":{"line":6,"column":14},"end":{"line":6,"column":24}}}) : helper)))
    + "-reviewers\" class=\"collapse-btn"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"expandReviewerList") : depth0),{"name":"unless","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":55},"end":{"line":6,"column":106}}})) != null ? stack1 : "")
    + "\" role=\"button\" data-toggle=\"collapse\" aria-expanded=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"expandReviewerList") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data,"loc":{"start":{"line":6,"column":160},"end":{"line":6,"column":210}}})) != null ? stack1 : "")
    + "\">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"expandReviewerList") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"data":data,"loc":{"start":{"line":6,"column":212},"end":{"line":6,"column":281}}})) != null ? stack1 : "")
    + "</a>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return " collapsed";
},"6":function(container,depth0,helpers,partials,data) {
    return "true";
},"8":function(container,depth0,helpers,partials,data) {
    return "false";
},"10":function(container,depth0,helpers,partials,data) {
    return "Hide reviewers";
},"12":function(container,depth0,helpers,partials,data) {
    return "Show reviewers";
},"14":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"unless").call(alias1,(lookupProperty(helpers,"isEmpty")||(depth0 && lookupProperty(depth0,"isEmpty"))||container.hooks.helperMissing).call(alias1,(depth0 != null ? lookupProperty(depth0,"reviewers") : depth0),{"name":"isEmpty","hash":{},"data":data,"loc":{"start":{"line":8,"column":14},"end":{"line":8,"column":33}}}),{"name":"unless","hash":{},"fn":container.program(15, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":8,"column":4},"end":{"line":10,"column":15}}})) != null ? stack1 : "");
},"15":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <a href=\"#"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"noteId") || (depth0 != null ? lookupProperty(depth0,"noteId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"noteId","hash":{},"data":data,"loc":{"start":{"line":9,"column":16},"end":{"line":9,"column":26}}}) : helper)))
    + "-reviewers\" class=\"collapse-btn"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"expandReviewerList") : depth0),{"name":"unless","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":9,"column":57},"end":{"line":9,"column":108}}})) != null ? stack1 : "")
    + "\" role=\"button\" data-toggle=\"collapse\" aria-expanded=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"expandReviewerList") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data,"loc":{"start":{"line":9,"column":162},"end":{"line":9,"column":212}}})) != null ? stack1 : "")
    + "\">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"expandReviewerList") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"data":data,"loc":{"start":{"line":9,"column":214},"end":{"line":9,"column":283}}})) != null ? stack1 : "")
    + "</a>\n";
},"17":function(container,depth0,helpers,partials,data) {
    return " in";
},"19":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <tr>\n            <td style=\"width: 40px;\"><strong>"
    + alias2(alias1(blockParams[0][1], depth0))
    + "</strong></td>\n            <td>\n              "
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"name") : stack1), depth0))
    + " "
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depths[1] != null ? lookupProperty(depths[1],"showPreferredEmail") : depths[1]),{"name":"if","hash":{},"fn":container.program(20, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":19,"column":28},"end":{"line":19,"column":190}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"status") : stack1),{"name":"if","hash":{},"fn":container.program(23, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":20,"column":14},"end":{"line":25,"column":21}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"completedReview") : stack1),{"name":"if","hash":{},"fn":container.program(26, data, 0, blockParams, depths),"inverse":container.program(40, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":26,"column":14},"end":{"line":41,"column":21}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depths[1] != null ? lookupProperty(depths[1],"showActivityModal") : depths[1]),{"name":"if","hash":{},"fn":container.program(47, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":42,"column":14},"end":{"line":45,"column":21}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"links") : stack1),{"name":"if","hash":{},"fn":container.program(49, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":46,"column":14},"end":{"line":51,"column":21}}})) != null ? stack1 : "")
    + "            </td>\n          </tr>\n";
},"20":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"id") : stack1),{"name":"if","hash":{},"fn":container.program(21, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":19,"column":57},"end":{"line":19,"column":183}}})) != null ? stack1 : "");
},"21":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<a href=\"#\" class=\"copy-email\"  data-user-id=\""
    + alias2(alias1(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\" data-user-name=\""
    + alias2(alias1(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"name") : stack1), depth0))
    + "\">Copy Email</a>";
},"23":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"status") : stack1),{"name":"each","hash":{},"fn":container.program(24, data, 2, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":21,"column":16},"end":{"line":24,"column":25}}})) != null ? stack1 : "");
},"24":function(container,depth0,helpers,partials,data,blockParams) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "                  <br>\n                  "
    + alias2(alias1(blockParams[0][1], depth0))
    + ": "
    + alias2(alias1(blockParams[0][0], depth0))
    + "\n";
},"26":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.lambda, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"preliminary_rating") : stack1),{"name":"if","hash":{},"fn":container.program(27, data, 0, blockParams, depths),"inverse":container.program(29, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":27,"column":16},"end":{"line":27,"column":189}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"confidence") : stack1),{"name":"if","hash":{},"fn":container.program(32, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":27,"column":189},"end":{"line":27,"column":253}}})) != null ? stack1 : "")
    + "\n                "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"reviewLength") : stack1),{"name":"if","hash":{},"fn":container.program(34, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":28,"column":16},"end":{"line":28,"column":91}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"ranking") : stack1),{"name":"if","hash":{},"fn":container.program(36, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":28,"column":91},"end":{"line":28,"column":143}}})) != null ? stack1 : "")
    + "\n                <br>\n                <a href=\"/forum?id="
    + alias3(alias2(((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + "&noteId="
    + alias3(alias2(((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"note") : stack1), depth0))
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]),{"name":"if","hash":{},"fn":container.program(38, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":30,"column":70},"end":{"line":30,"column":121}}})) != null ? stack1 : "")
    + "\" target=\"_blank\">Read Review</a>\n";
},"27":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<br>Rating preliminary: "
    + alias2(alias1(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"preliminary_rating") : stack1), depth0))
    + "|final: "
    + alias2(alias1(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"rating") : stack1), depth0));
},"29":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"rating") : stack1),{"name":"if","hash":{},"fn":container.program(30, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":27,"column":129},"end":{"line":27,"column":182}}})) != null ? stack1 : "");
},"30":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<br>Rating: "
    + container.escapeExpression(container.lambda(((stack1 = blockParams[3][0]) != null ? lookupProperty(stack1,"rating") : stack1), depth0));
},"32":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return " / Confidence: "
    + container.escapeExpression(container.lambda(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"confidence") : stack1), depth0));
},"34":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<br>Review length: "
    + container.escapeExpression(container.lambda(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"reviewLength") : stack1), depth0))
    + " / ";
},"36":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "Ranking: "
    + container.escapeExpression(container.lambda(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"ranking") : stack1), depth0));
},"38":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&referrer="
    + container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]), depth0));
},"40":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                <br>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depths[1] != null ? lookupProperty(depths[1],"enableReviewerReassignment") : depths[1]),{"name":"if","hash":{},"fn":container.program(41, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":33,"column":16},"end":{"line":36,"column":23}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depths[1] != null ? lookupProperty(depths[1],"sendReminder") : depths[1]),{"name":"if","hash":{},"fn":container.program(44, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":37,"column":16},"end":{"line":40,"column":23}}})) != null ? stack1 : "");
},"41":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                  <a href=\"#\" class=\"unassign-reviewer-link\" data-paper-forum=\""
    + alias2(alias1(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + "\" data-user-id=\""
    + alias2(alias1(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\" data-paper-number=\""
    + alias2(alias1(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"paperNumber") : stack1), depth0))
    + "\" data-reviewer-number=\""
    + alias2(alias1(blockParams[2][1], depth0))
    + "\">Unassign</a>\n                  "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depths[1] != null ? lookupProperty(depths[1],"sendReminder") : depths[1]),{"name":"if","hash":{},"fn":container.program(42, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":35,"column":18},"end":{"line":35,"column":67}}})) != null ? stack1 : "")
    + "\n";
},"42":function(container,depth0,helpers,partials,data) {
    return " &nbsp;&bull;&nbsp;";
},"44":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                  <a href=\"#\" class=\"send-reminder-link\" data-user-id=\""
    + alias2(alias1(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"anonymousGroupId") : stack1), depth0))
    + "\" data-forum-url=\""
    + ((stack1 = alias1(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"forumUrl") : stack1), depth0)) != null ? stack1 : "")
    + "\" data-paper-number=\""
    + alias2(alias1(((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"paperNumber") : stack1), depth0))
    + "\">Send Reminder</a>\n                  "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = blockParams[2][0]) != null ? lookupProperty(stack1,"lastReminderSent") : stack1),{"name":"if","hash":{},"fn":container.program(45, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":39,"column":18},"end":{"line":39,"column":92}}})) != null ? stack1 : "")
    + "\n";
},"45":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "(Last sent: "
    + container.escapeExpression(container.lambda(((stack1 = blockParams[3][0]) != null ? lookupProperty(stack1,"lastReminderSent") : stack1), depth0))
    + ")";
},"47":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                <br>\n                <a href=\"#\" class=\"show-activity-modal\" data-paper-num=\""
    + alias2(alias1((depths[1] != null ? lookupProperty(depths[1],"paperNumber") : depths[1]), depth0))
    + "\" data-reviewer-num=\""
    + alias2(alias1(blockParams[1][1], depth0))
    + "\" data-reviewer-name=\""
    + alias2(alias1(((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"name") : stack1), depth0))
    + "\" data-reviewer-email=\""
    + alias2(alias1(((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"email") : stack1), depth0))
    + "\">Show Reviewer Activity</a>\n";
},"49":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"links") : stack1),{"name":"each","hash":{},"fn":container.program(50, data, 2, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":47,"column":16},"end":{"line":50,"column":25}}})) != null ? stack1 : "");
},"50":function(container,depth0,helpers,partials,data,blockParams) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "                  <br>\n                  <a href=\""
    + alias2(alias1(blockParams[0][0], depth0))
    + "\">"
    + alias2(alias1(blockParams[0][1], depth0))
    + "</a>\n";
},"52":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"paperNumber") || (depth0 != null ? lookupProperty(depth0,"paperNumber") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"paperNumber","hash":{},"data":data,"loc":{"start":{"line":58,"column":15},"end":{"line":58,"column":30}}}) : helper)))
    + "-add-reviewer\" class=\"div-add-reviewer\"></div>\n";
},"54":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <br>\n      <strong>Average "
    + alias2(alias1(blockParams[0][1], depth0))
    + ":</strong> "
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"avg") : stack1), depth0))
    + " (Min: "
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"min") : stack1), depth0))
    + ", Max: "
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"max") : stack1), depth0))
    + ")\n";
},"56":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <br>\n      <strong>Average Rating:</strong> "
    + alias4(((helper = (helper = lookupProperty(helpers,"averageRating") || (depth0 != null ? lookupProperty(depth0,"averageRating") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"averageRating","hash":{},"data":data,"loc":{"start":{"line":69,"column":39},"end":{"line":69,"column":56}}}) : helper)))
    + " (Min: "
    + alias4(((helper = (helper = lookupProperty(helpers,"minRating") || (depth0 != null ? lookupProperty(depth0,"minRating") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"minRating","hash":{},"data":data,"loc":{"start":{"line":69,"column":63},"end":{"line":69,"column":76}}}) : helper)))
    + ", Max: "
    + alias4(((helper = (helper = lookupProperty(helpers,"maxRating") || (depth0 != null ? lookupProperty(depth0,"maxRating") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"maxRating","hash":{},"data":data,"loc":{"start":{"line":69,"column":83},"end":{"line":69,"column":96}}}) : helper)))
    + ")\n";
},"58":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <br>\n      <strong>Average Confidence:</strong> "
    + alias4(((helper = (helper = lookupProperty(helpers,"averageConfidence") || (depth0 != null ? lookupProperty(depth0,"averageConfidence") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"averageConfidence","hash":{},"data":data,"loc":{"start":{"line":73,"column":43},"end":{"line":73,"column":64}}}) : helper)))
    + " (Min: "
    + alias4(((helper = (helper = lookupProperty(helpers,"minConfidence") || (depth0 != null ? lookupProperty(depth0,"minConfidence") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"minConfidence","hash":{},"data":data,"loc":{"start":{"line":73,"column":71},"end":{"line":73,"column":88}}}) : helper)))
    + ", Max: "
    + alias4(((helper = (helper = lookupProperty(helpers,"maxConfidence") || (depth0 != null ? lookupProperty(depth0,"maxConfidence") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"maxConfidence","hash":{},"data":data,"loc":{"start":{"line":73,"column":95},"end":{"line":73,"column":112}}}) : helper)))
    + ")\n";
},"60":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <br>\n      <strong>Number of Forum replies:</strong> "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"forumReplyCount") || (depth0 != null ? lookupProperty(depth0,"forumReplyCount") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"forumReplyCount","hash":{},"data":data,"loc":{"start":{"line":77,"column":48},"end":{"line":77,"column":67}}}) : helper)))
    + "\n";
},"62":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <br>\n      <a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"url") || (depth0 != null ? lookupProperty(depth0,"url") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"url","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":84,"column":15},"end":{"line":84,"column":22}}}) : helper)))
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]),{"name":"if","hash":{},"fn":container.program(38, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":84,"column":22},"end":{"line":84,"column":73}}})) != null ? stack1 : "")
    + "\" target=\"_blank\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":84,"column":91},"end":{"line":84,"column":99}}}) : helper)))
    + "</a>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"paperNumber") || (depth0 != null ? lookupProperty(depth0,"paperNumber") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"paperNumber","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":1,"column":9},"end":{"line":1,"column":24}}}) : helper)))
    + "-reviewer-progress\" class=\"reviewer-progress\" data-paper-forum=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"noteId") || (depth0 != null ? lookupProperty(depth0,"noteId") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"noteId","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":1,"column":88},"end":{"line":1,"column":98}}}) : helper)))
    + "\">\n  <h4>"
    + alias4(((helper = (helper = lookupProperty(helpers,"numSubmittedReviews") || (depth0 != null ? lookupProperty(depth0,"numSubmittedReviews") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numSubmittedReviews","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":2,"column":6},"end":{"line":2,"column":29}}}) : helper)))
    + " of "
    + alias4(((helper = (helper = lookupProperty(helpers,"numReviewers") || (depth0 != null ? lookupProperty(depth0,"numReviewers") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numReviewers","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":2,"column":33},"end":{"line":2,"column":49}}}) : helper)))
    + " Reviews Submitted</h4>\n  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"numSubmittedRecommendations") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":3,"column":2},"end":{"line":3,"column":130}}})) != null ? stack1 : "")
    + "\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"enableReviewerReassignment") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.program(14, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":5,"column":2},"end":{"line":11,"column":9}}})) != null ? stack1 : "")
    + "  <div id=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"noteId") || (depth0 != null ? lookupProperty(depth0,"noteId") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"noteId","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":12,"column":11},"end":{"line":12,"column":21}}}) : helper)))
    + "-reviewers\" class=\"collapse"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"expandReviewerList") : depth0),{"name":"if","hash":{},"fn":container.program(17, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":12,"column":48},"end":{"line":12,"column":84}}})) != null ? stack1 : "")
    + "\">\n    <table class=\"table table-condensed table-minimal\">\n      <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"reviewers") : depth0),{"name":"each","hash":{},"fn":container.program(19, data, 2, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":15,"column":8},"end":{"line":54,"column":17}}})) != null ? stack1 : "")
    + "      </tbody>\n    </table>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"enableReviewerReassignment") : depth0),{"name":"if","hash":{},"fn":container.program(52, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":57,"column":4},"end":{"line":59,"column":11}}})) != null ? stack1 : "")
    + "  </div>\n\n  <div>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"stats") : depth0),{"name":"each","hash":{},"fn":container.program(54, data, 2, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":63,"column":4},"end":{"line":66,"column":13}}})) != null ? stack1 : "")
    + ((stack1 = (lookupProperty(helpers,"isnt")||(depth0 && lookupProperty(depth0,"isnt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"averageRating") : depth0),undefined,{"name":"isnt","hash":{},"fn":container.program(56, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":67,"column":4},"end":{"line":70,"column":13}}})) != null ? stack1 : "")
    + ((stack1 = (lookupProperty(helpers,"isnt")||(depth0 && lookupProperty(depth0,"isnt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"averageConfidence") : depth0),undefined,{"name":"isnt","hash":{},"fn":container.program(58, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":71,"column":4},"end":{"line":74,"column":13}}})) != null ? stack1 : "")
    + ((stack1 = (lookupProperty(helpers,"isnt")||(depth0 && lookupProperty(depth0,"isnt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"forumReplyCount") : depth0),undefined,{"name":"isnt","hash":{},"fn":container.program(60, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":75,"column":4},"end":{"line":78,"column":13}}})) != null ? stack1 : "")
    + "  </div>\n\n  <div>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"actions") : depth0),{"name":"each","hash":{},"fn":container.program(62, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":82,"column":4},"end":{"line":85,"column":13}}})) != null ? stack1 : "")
    + "  </div>\n</div>\n";
},"useData":true,"useDepths":true,"useBlockParams":true});
templates['noteSummary'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "-new";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&referrer="
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"referrer") || (depth0 != null ? lookupProperty(depth0,"referrer") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"referrer","hash":{},"data":data,"loc":{"start":{"line":4,"column":92},"end":{"line":4,"column":104}}}) : helper)));
},"5":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div style=\"margin-bottom: .5rem;\">\n      <a href=\""
    + alias3((lookupProperty(helpers,"pdfUrl")||(depth0 && lookupProperty(depth0,"pdfUrl"))||alias2).call(alias1,depth0,false,{"name":"pdfUrl","hash":{},"data":data,"loc":{"start":{"line":8,"column":15},"end":{"line":8,"column":36}}}))
    + "\" class=\"attachment-download-link\" title=\"Download PDF\" target=\"_blank\" download=\""
    + alias3(((helper = (helper = lookupProperty(helpers,"number") || (depth0 != null ? lookupProperty(depth0,"number") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"number","hash":{},"data":data,"loc":{"start":{"line":8,"column":118},"end":{"line":8,"column":128}}}) : helper)))
    + ".pdf\">\n        <span class=\"glyphicon glyphicon-download-alt\" aria-hidden=\"true\"></span> Download PDF\n      </a>\n    </div>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"note-authors\">"
    + container.escapeExpression((lookupProperty(helpers,"noteAuthors")||(depth0 && lookupProperty(depth0,"noteAuthors"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"content") : depth0),(depth0 != null ? lookupProperty(depth0,"signatures") : depth0),(depth0 != null ? lookupProperty(depth0,"details") : depth0),{"name":"noteAuthors","hash":{},"data":data,"loc":{"start":{"line":14,"column":30},"end":{"line":14,"column":72}}}))
    + "</div>\n";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"note-authors\">Conflict Domains: "
    + container.escapeExpression((lookupProperty(helpers,"join")||(depth0 && lookupProperty(depth0,"join"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"authorDomains") : stack1),{"name":"join","hash":{},"data":data,"loc":{"start":{"line":17,"column":48},"end":{"line":17,"column":78}}}))
    + "</div>\n";
},"11":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div>\n      <span class=\"date\"><strong>Submission date</strong>: "
    + container.escapeExpression((lookupProperty(helpers,"forumDate")||(depth0 && lookupProperty(depth0,"forumDate"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"cdate") : depth0),(depth0 != null ? lookupProperty(depth0,"tcdate") : depth0),(depth0 != null ? lookupProperty(depth0,"mdate") : depth0),(depth0 != null ? lookupProperty(depth0,"tmdate") : depth0),((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"year") : stack1),null,{"name":"forumDate","hash":{},"data":data,"loc":{"start":{"line":22,"column":59},"end":{"line":22,"column":116}}}))
    + "</span>\n    </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id=\"note-summary-"
    + alias4(((helper = (helper = lookupProperty(helpers,"number") || (depth0 != null ? lookupProperty(depth0,"number") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"number","hash":{},"data":data,"loc":{"start":{"line":2,"column":22},"end":{"line":2,"column":32}}}) : helper)))
    + "\" class=\"note\" data-id=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":2,"column":56},"end":{"line":2,"column":62}}}) : helper)))
    + "\">\n  <h4>\n    <a href=\"/forum"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"useNewForumPage") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":4,"column":19},"end":{"line":4,"column":53}}})) != null ? stack1 : "")
    + "?id="
    + alias4(((helper = (helper = lookupProperty(helpers,"forum") || (depth0 != null ? lookupProperty(depth0,"forum") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"forum","hash":{},"data":data,"loc":{"start":{"line":4,"column":57},"end":{"line":4,"column":66}}}) : helper)))
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"referrer") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":4,"column":66},"end":{"line":4,"column":111}}})) != null ? stack1 : "")
    + "\" target=\"_blank\">"
    + alias4(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "</a>\n  </h4>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"pdf") : stack1),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":2},"end":{"line":12,"column":9}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"authors") : stack1),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":13,"column":2},"end":{"line":15,"column":9}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"authorDomains") : stack1),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":16,"column":2},"end":{"line":18,"column":9}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"showDates") : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":20,"column":2},"end":{"line":24,"column":9}}})) != null ? stack1 : "")
    + "\n  "
    + alias4((lookupProperty(helpers,"noteContentCollapsible")||(depth0 && lookupProperty(depth0,"noteContentCollapsible"))||alias2).call(alias1,depth0,{"name":"noteContentCollapsible","hash":{},"data":data,"loc":{"start":{"line":26,"column":2},"end":{"line":26,"column":33}}}))
    + "\n</div>\n";
},"useData":true});
templates['notesAreaChairProgress'] = template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), alias4=container.hooks.helperMissing, alias5="function", lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <tr>\n          <td style=\"width: 28px;\"><strong>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"note") : depth0)) != null ? lookupProperty(stack1,"number") : stack1), depth0))
    + ".</strong></td>\n          <td style=\"width: 314px;\"><a href=\"/forum?id="
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"note") : depth0)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]),{"name":"if","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":10,"column":69},"end":{"line":10,"column":120}}})) != null ? stack1 : "")
    + "\" target=\"_blank\">"
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"note") : depth0)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "</a></td>\n        </tr>\n        <tr>\n          <td style=\"width: 28px;\"></td>\n          <td style=\"width: 314px;\"><strong>"
    + alias2(((helper = (helper = lookupProperty(helpers,"numOfReviews") || (depth0 != null ? lookupProperty(depth0,"numOfReviews") : depth0)) != null ? helper : alias4),(typeof helper === alias5 ? helper.call(alias3,{"name":"numOfReviews","hash":{},"data":data,"loc":{"start":{"line":14,"column":44},"end":{"line":14,"column":60}}}) : helper)))
    + " of "
    + alias2(((helper = (helper = lookupProperty(helpers,"numOfReviewers") || (depth0 != null ? lookupProperty(depth0,"numOfReviewers") : depth0)) != null ? helper : alias4),(typeof helper === alias5 ? helper.call(alias3,{"name":"numOfReviewers","hash":{},"data":data,"loc":{"start":{"line":14,"column":64},"end":{"line":14,"column":82}}}) : helper)))
    + " Reviews Submitted </strong>"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depth0 != null ? lookupProperty(depth0,"averageRating") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":14,"column":110},"end":{"line":14,"column":223}}})) != null ? stack1 : "")
    + "</td>\n        </tr>\n";
},"2":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&referrer="
    + container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]), depth0));
},"4":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "/ Average Rating:</strong> "
    + alias4(((helper = (helper = lookupProperty(helpers,"averageRating") || (depth0 != null ? lookupProperty(depth0,"averageRating") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"averageRating","hash":{},"data":data,"loc":{"start":{"line":14,"column":158},"end":{"line":14,"column":175}}}) : helper)))
    + " (Min: "
    + alias4(((helper = (helper = lookupProperty(helpers,"minRating") || (depth0 != null ? lookupProperty(depth0,"minRating") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"minRating","hash":{},"data":data,"loc":{"start":{"line":14,"column":182},"end":{"line":14,"column":195}}}) : helper)))
    + ", Max: "
    + alias4(((helper = (helper = lookupProperty(helpers,"maxRating") || (depth0 != null ? lookupProperty(depth0,"maxRating") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"maxRating","hash":{},"data":data,"loc":{"start":{"line":14,"column":202},"end":{"line":14,"column":215}}}) : helper)))
    + ")";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"reviewer-progress\">\n  <h4>"
    + alias4(((helper = (helper = lookupProperty(helpers,"numCompletedReviews") || (depth0 != null ? lookupProperty(depth0,"numCompletedReviews") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numCompletedReviews","hash":{},"data":data,"loc":{"start":{"line":2,"column":6},"end":{"line":2,"column":29}}}) : helper)))
    + " of "
    + alias4(((helper = (helper = lookupProperty(helpers,"numPapers") || (depth0 != null ? lookupProperty(depth0,"numPapers") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numPapers","hash":{},"data":data,"loc":{"start":{"line":2,"column":33},"end":{"line":2,"column":46}}}) : helper)))
    + " Papers Reviews Completed</h4>\n\n  <strong>Papers:</strong>\n  <table class=\"table table-condensed table-minimal\">\n    <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"papers") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":7,"column":6},"end":{"line":16,"column":15}}})) != null ? stack1 : "")
    + "    </tbody>\n  </table>\n\n</div>\n";
},"useData":true,"useDepths":true});
templates['notesAreaChairStatus'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"metaReviewName") || (depth0 != null ? lookupProperty(depth0,"metaReviewName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"metaReviewName","hash":{},"data":data,"loc":{"start":{"line":2,"column":80},"end":{"line":2,"column":98}}}) : helper)));
},"3":function(container,depth0,helpers,partials,data) {
    return "Meta Review";
},"5":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"metaReview") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0, blockParams, depths),"inverse":container.program(13, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":8,"column":8},"end":{"line":31,"column":15}}})) != null ? stack1 : "");
},"6":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <tr>\n          <td style=\"width: 28px;\"><strong>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"note") : depth0)) != null ? lookupProperty(stack1,"number") : stack1), depth0))
    + ".</strong></td>\n          <td style=\"width: 214px;\">\n            "
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"note") : depth0)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"venue") : stack1), depth0))
    + " - "
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"metaReview") : depth0)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"recommendation") : stack1), depth0))
    + "\n            "
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"metaReview") : depth0)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"format") : stack1),{"name":"if","hash":{},"fn":container.program(7, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":13,"column":12},"end":{"line":13,"column":91}}})) != null ? stack1 : "")
    + "\n          </td>\n        </tr>\n        <tr>\n          <td style=\"width: 28px;\"></td>\n          <td style=\"width: 214px;\">\n            <a href=\"/forum?id="
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"metaReview") : depth0)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + "&noteId="
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"metaReview") : depth0)) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]),{"name":"if","hash":{},"fn":container.program(9, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":19,"column":76},"end":{"line":19,"column":127}}})) != null ? stack1 : "")
    + "\" target=\"_blank\">Read "
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depths[1] != null ? lookupProperty(depths[1],"metaReviewName") : depths[1]),{"name":"if","hash":{},"fn":container.program(11, data, 0, blockParams, depths),"inverse":container.program(3, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":19,"column":150},"end":{"line":19,"column":222}}})) != null ? stack1 : "")
    + "</a>\n          </td>\n        </tr>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "/ Format: "
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"metaReview") : depth0)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"format") : stack1), depth0));
},"9":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&referrer="
    + container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]), depth0));
},"11":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"metaReviewName") : depths[1]), depth0));
},"13":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <tr>\n          <td style=\"width: 28px;\"><strong>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"note") : depth0)) != null ? lookupProperty(stack1,"number") : stack1), depth0))
    + ".</strong></td>\n          <td style=\"width: 214px;\">"
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"note") : depth0)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"venue") : stack1), depth0))
    + " - No "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depths[1] != null ? lookupProperty(depths[1],"metaReviewName") : depths[1]),{"name":"if","hash":{},"fn":container.program(11, data, 0, blockParams, depths),"inverse":container.program(3, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":25,"column":64},"end":{"line":25,"column":136}}})) != null ? stack1 : "")
    + "</td>\n        </tr>\n        <tr>\n          <td style=\"width: 28px;\"></td>\n          <td></td>\n        </tr>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"reviewer-progress\">\n  <h4>"
    + alias4(((helper = (helper = lookupProperty(helpers,"numCompletedMetaReviews") || (depth0 != null ? lookupProperty(depth0,"numCompletedMetaReviews") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numCompletedMetaReviews","hash":{},"data":data,"loc":{"start":{"line":2,"column":6},"end":{"line":2,"column":33}}}) : helper)))
    + " of "
    + alias4(((helper = (helper = lookupProperty(helpers,"numPapers") || (depth0 != null ? lookupProperty(depth0,"numPapers") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numPapers","hash":{},"data":data,"loc":{"start":{"line":2,"column":37},"end":{"line":2,"column":50}}}) : helper)))
    + " Papers "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"metaReviewName") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.program(3, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":2,"column":58},"end":{"line":2,"column":124}}})) != null ? stack1 : "")
    + "s Completed</h4>\n\n  <strong>Papers:</strong>\n  <table class=\"table table-condensed table-minimal\">\n    <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"papers") : depth0),{"name":"each","hash":{},"fn":container.program(5, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":7,"column":6},"end":{"line":32,"column":15}}})) != null ? stack1 : "")
    + "    </tbody>\n  </table>\n\n</div>\n";
},"useData":true,"useDepths":true});
templates['notesReviewerProgress'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h4>"
    + alias4(((helper = (helper = lookupProperty(helpers,"numSubmittedRecommendations") || (depth0 != null ? lookupProperty(depth0,"numSubmittedRecommendations") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numSubmittedRecommendations","hash":{},"data":data,"loc":{"start":{"line":3,"column":41},"end":{"line":3,"column":72}}}) : helper)))
    + " of "
    + alias4(((helper = (helper = lookupProperty(helpers,"numPapers") || (depth0 != null ? lookupProperty(depth0,"numPapers") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numPapers","hash":{},"data":data,"loc":{"start":{"line":3,"column":76},"end":{"line":3,"column":89}}}) : helper)))
    + " Recommendations Submitted</h4>";
},"3":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <tr>\n          <td style=\"width: 28px;\"><strong>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"note") : depth0)) != null ? lookupProperty(stack1,"number") : stack1), depth0))
    + ".</strong></td>\n          <td style=\"width: 300px;\"><a href=\"/forum?id="
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"note") : depth0)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":11,"column":69},"end":{"line":11,"column":120}}})) != null ? stack1 : "")
    + "\" target=\"_blank\">"
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"note") : depth0)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "</a></td>\n        </tr>\n        <tr>\n          <td style=\"width: 28px;\"></td>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depth0 != null ? lookupProperty(depth0,"review") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0, blockParams, depths),"inverse":container.program(12, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":15,"column":10},"end":{"line":30,"column":17}}})) != null ? stack1 : "")
    + "        </tr>\n";
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&referrer="
    + container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]), depth0));
},"6":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.lambda, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"review") : depth0)) != null ? lookupProperty(stack1,"status") : stack1),{"name":"if","hash":{},"fn":container.program(7, data, 0, blockParams, depths),"inverse":container.program(10, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":16,"column":12},"end":{"line":24,"column":19}}})) != null ? stack1 : "")
    + "          <td>\n            <a href=\"/forum?id="
    + alias3(alias2(((stack1 = (depth0 != null ? lookupProperty(depth0,"review") : depth0)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + "&noteId="
    + alias3(alias2(((stack1 = (depth0 != null ? lookupProperty(depth0,"review") : depth0)) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depths[1] != null ? lookupProperty(depths[1],"referrer") : depths[1]),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":26,"column":68},"end":{"line":26,"column":119}}})) != null ? stack1 : "")
    + "\" target=\"_blank\">Read Review</a>\n          </td>\n";
},"7":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              <td style=\"width: 300px;\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"review") : depth0)) != null ? lookupProperty(stack1,"status") : stack1),{"name":"each","hash":{},"fn":container.program(8, data, 2, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":18,"column":16},"end":{"line":20,"column":25}}})) != null ? stack1 : "")
    + "              </td>\n";
},"8":function(container,depth0,helpers,partials,data,blockParams) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "                  "
    + alias2(alias1(blockParams[0][1], depth0))
    + ": "
    + alias2(alias1(blockParams[0][0], depth0))
    + " /\n";
},"10":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              <td style=\"width: 300px;\">Rating: "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"review") : depth0)) != null ? lookupProperty(stack1,"rating") : stack1), depth0))
    + " / Confidence: "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"review") : depth0)) != null ? lookupProperty(stack1,"confidence") : stack1), depth0))
    + " / Review length: "
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"review") : depth0)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"review") : stack1)) != null ? lookupProperty(stack1,"length") : stack1), depth0))
    + "</td>\n";
},"12":function(container,depth0,helpers,partials,data) {
    return "          <td style=\"width: 300px;\"></td>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"reviewer-progress\">\n  <h4>"
    + alias4(((helper = (helper = lookupProperty(helpers,"numCompletedReviews") || (depth0 != null ? lookupProperty(depth0,"numCompletedReviews") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numCompletedReviews","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":2,"column":6},"end":{"line":2,"column":29}}}) : helper)))
    + " of "
    + alias4(((helper = (helper = lookupProperty(helpers,"numPapers") || (depth0 != null ? lookupProperty(depth0,"numPapers") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numPapers","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":2,"column":33},"end":{"line":2,"column":46}}}) : helper)))
    + " Reviews Submitted</h4>\n  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"numSubmittedRecommendations") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":3,"column":2},"end":{"line":3,"column":127}}})) != null ? stack1 : "")
    + "\n\n  <strong>Papers:</strong>\n  <table class=\"table table-condensed table-minimal\">\n    <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"papers") : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":8,"column":6},"end":{"line":32,"column":15}}})) != null ? stack1 : "")
    + "    </tbody>\n  </table>\n\n</div>\n";
},"useData":true,"useDepths":true,"useBlockParams":true});
templates['notesReviewerStatus'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h4>"
    + alias4(((helper = (helper = lookupProperty(helpers,"numSubmittedRecommendations") || (depth0 != null ? lookupProperty(depth0,"numSubmittedRecommendations") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numSubmittedRecommendations","hash":{},"data":data,"loc":{"start":{"line":3,"column":41},"end":{"line":3,"column":72}}}) : helper)))
    + " of "
    + alias4(((helper = (helper = lookupProperty(helpers,"numPapers") || (depth0 != null ? lookupProperty(depth0,"numPapers") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numPapers","hash":{},"data":data,"loc":{"start":{"line":3,"column":76},"end":{"line":3,"column":89}}}) : helper)))
    + " Recommendations Submitted</h4>";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=container.escapeExpression, alias2=depth0 != null ? depth0 : (container.nullContext || {}), alias3=container.hooks.helperMissing, alias4="function", lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <tr>\n          <td style=\"width: 28px;\"><strong>"
    + alias1(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"note") : depth0)) != null ? lookupProperty(stack1,"number") : stack1), depth0))
    + ".</strong></td>\n          <td style=\"width: 280px;\"><strong>"
    + alias1(((helper = (helper = lookupProperty(helpers,"numOfReviews") || (depth0 != null ? lookupProperty(depth0,"numOfReviews") : depth0)) != null ? helper : alias3),(typeof helper === alias4 ? helper.call(alias2,{"name":"numOfReviews","hash":{},"data":data,"loc":{"start":{"line":11,"column":44},"end":{"line":11,"column":60}}}) : helper)))
    + " of "
    + alias1(((helper = (helper = lookupProperty(helpers,"numOfReviewers") || (depth0 != null ? lookupProperty(depth0,"numOfReviewers") : depth0)) != null ? helper : alias3),(typeof helper === alias4 ? helper.call(alias2,{"name":"numOfReviewers","hash":{},"data":data,"loc":{"start":{"line":11,"column":64},"end":{"line":11,"column":82}}}) : helper)))
    + " Reviews Submitted </strong></td>\n        </tr>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias2,(depth0 != null ? lookupProperty(depth0,"averageRating") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":13,"column":8},"end":{"line":18,"column":15}}})) != null ? stack1 : "");
},"4":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <tr>\n            <td style=\"width: 28px;\"></td>\n            <td style=\"width: 280px;\">Average Rating: "
    + alias4(((helper = (helper = lookupProperty(helpers,"averageRating") || (depth0 != null ? lookupProperty(depth0,"averageRating") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"averageRating","hash":{},"data":data,"loc":{"start":{"line":16,"column":54},"end":{"line":16,"column":71}}}) : helper)))
    + " (Min: "
    + alias4(((helper = (helper = lookupProperty(helpers,"minRating") || (depth0 != null ? lookupProperty(depth0,"minRating") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"minRating","hash":{},"data":data,"loc":{"start":{"line":16,"column":78},"end":{"line":16,"column":91}}}) : helper)))
    + ", Max: "
    + alias4(((helper = (helper = lookupProperty(helpers,"maxRating") || (depth0 != null ? lookupProperty(depth0,"maxRating") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"maxRating","hash":{},"data":data,"loc":{"start":{"line":16,"column":98},"end":{"line":16,"column":111}}}) : helper)))
    + ")</td>\n          </tr>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"reviewer-progress\">\n  <h4>"
    + alias4(((helper = (helper = lookupProperty(helpers,"numCompletedReviews") || (depth0 != null ? lookupProperty(depth0,"numCompletedReviews") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numCompletedReviews","hash":{},"data":data,"loc":{"start":{"line":2,"column":6},"end":{"line":2,"column":29}}}) : helper)))
    + " of "
    + alias4(((helper = (helper = lookupProperty(helpers,"numPapers") || (depth0 != null ? lookupProperty(depth0,"numPapers") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"numPapers","hash":{},"data":data,"loc":{"start":{"line":2,"column":33},"end":{"line":2,"column":46}}}) : helper)))
    + " Reviews Completed</h4>\n  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"numSubmittedRecommendations") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":2},"end":{"line":3,"column":127}}})) != null ? stack1 : "")
    + "\n\n  <strong>Papers:</strong>\n  <table class=\"table table-condensed table-minimal\">\n    <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"papers") : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":8,"column":6},"end":{"line":19,"column":15}}})) != null ? stack1 : "")
    + "    </tbody>\n  </table>\n\n</div>\n";
},"useData":true});
templates['spinner'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"spinner-container "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"extraClasses") || (depth0 != null ? lookupProperty(depth0,"extraClasses") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"extraClasses","hash":{},"data":data,"loc":{"start":{"line":1,"column":30},"end":{"line":1,"column":46}}}) : helper)))
    + "\">\n  <div class=\"spinner\">\n    <div class=\"rect1\"></div>\n    <div class=\"rect2\"></div>\n    <div class=\"rect3\"></div>\n    <div class=\"rect4\"></div>\n    <div class=\"rect5\"></div>\n  </div>\n  <span>Loading</span>\n</div>\n";
},"useData":true});
templates['tagWidget_bid'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "incomplete";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"value") : stack1), depth0));
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"placeholder") : stack1), depth0));
},"7":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "        <li>\n          <a href=\"#\" data-value=\""
    + alias2(alias1(depth0, depth0))
    + "\">"
    + alias2(alias1(depth0, depth0))
    + "</a>\n        </li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.escapeExpression, alias3=container.lambda, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div\n  class=\"tag-widget bid "
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":24},"end":{"line":2,"column":66}}})) != null ? stack1 : "")
    + " "
    + alias2(((helper = (helper = lookupProperty(helpers,"extraClasses") || (depth0 != null ? lookupProperty(depth0,"extraClasses") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"extraClasses","hash":{},"data":data,"loc":{"start":{"line":2,"column":67},"end":{"line":2,"column":83}}}) : helper)))
    + "\"\n  data-type=\"bid\"\n  data-id=\""
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\"\n  data-invitation-id=\""
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"invitationId") : stack1), depth0))
    + "\"\n>\n  <label>"
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"label") : stack1), depth0))
    + ":</label>\n  <div class=\"btn-group\">\n    <button class=\"btn btn-default btn-xs btn-link dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">\n      <span class=\"bid-value\">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"data":data,"loc":{"start":{"line":10,"column":30},"end":{"line":10,"column":98}}})) != null ? stack1 : "")
    + "</span>\n      <span class=\"caret\"></span>\n    </button>\n    <ul class=\"dropdown-menu\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"options") : stack1),{"name":"each","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":14,"column":6},"end":{"line":18,"column":15}}})) != null ? stack1 : "")
    + "    </ul>\n  </div>\n</div>\n";
},"useData":true});
templates['tagWidget_radio'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "incomplete";
},"3":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.lambda, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <label\n        class=\"btn btn-default radio-toggle "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"tag") : depths[1])) != null ? lookupProperty(stack1,"value") : stack1),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":15,"column":44},"end":{"line":15,"column":109}}})) != null ? stack1 : "")
    + "\"\n        data-value=\""
    + alias3(alias2(depth0, depth0))
    + "\"\n        "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depths[1] != null ? lookupProperty(depths[1],"isTagWidget") : depths[1]),{"name":"if","hash":{},"fn":container.program(7, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":17,"column":8},"end":{"line":17,"column":59}}})) != null ? stack1 : "")
    + "\n      >\n        <input\n          type=\"radio\"\n          name=\"tag-options\"\n          autocomplete=\"off\"\n          "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"tag") : depths[1])) != null ? lookupProperty(stack1,"value") : stack1),{"name":"if","hash":{},"fn":container.program(9, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":23,"column":10},"end":{"line":23,"column":76}}})) != null ? stack1 : "")
    + "\n        > "
    + alias3(alias2(depth0, depth0))
    + "\n      </label>\n";
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = (lookupProperty(helpers,"is")||(depth0 && lookupProperty(depth0,"is"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"tag") : depths[1])) != null ? lookupProperty(stack1,"value") : stack1),{"name":"is","hash":{},"fn":container.program(5, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":15,"column":64},"end":{"line":15,"column":102}}})) != null ? stack1 : "");
},"5":function(container,depth0,helpers,partials,data) {
    return "active";
},"7":function(container,depth0,helpers,partials,data) {
    return "data-weight=\""
    + container.escapeExpression(container.lambda(depth0, depth0))
    + "\"";
},"9":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = (lookupProperty(helpers,"is")||(depth0 && lookupProperty(depth0,"is"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"tag") : depths[1])) != null ? lookupProperty(stack1,"value") : stack1),{"name":"is","hash":{},"fn":container.program(10, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":23,"column":30},"end":{"line":23,"column":69}}})) != null ? stack1 : "");
},"10":function(container,depth0,helpers,partials,data) {
    return "checked";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.escapeExpression, alias3=container.lambda, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div\n  class=\"tag-widget "
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"unless","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":20},"end":{"line":2,"column":62}}})) != null ? stack1 : "")
    + " "
    + alias2(((helper = (helper = lookupProperty(helpers,"extraClasses") || (depth0 != null ? lookupProperty(depth0,"extraClasses") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"extraClasses","hash":{},"data":data,"loc":{"start":{"line":2,"column":63},"end":{"line":2,"column":79}}}) : helper)))
    + "\"\n  data-type=\"radio\"\n  data-id=\""
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\"\n  data-invitation-id=\""
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"invitationId") : stack1), depth0))
    + "\"\n>\n  <label>"
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"label") : stack1), depth0))
    + ":</label>\n  <div class=\"btn-group btn-group-xs\" role=\"group\" data-toggle=\"buttons\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"options") : stack1),{"name":"each","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":9,"column":4},"end":{"line":26,"column":13}}})) != null ? stack1 : "")
    + "  </div>\n</div>\n";
},"useData":true,"useDepths":true});
templates['tagWidget_recommend'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "incomplete";
},"3":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"selected-reviewer\" data-id=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + "\" data-tag=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"tag") : depth0), depth0))
    + "\">\n      "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"name") : depth0), depth0))
    + " <a href=\"#\" title=\"Delete recommendation\"><span class=\"glyphicon glyphicon-remove\" aria-hidden=\"true\"></span></a>\n    </span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.escapeExpression, alias3=container.lambda, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"tag-widget recommend "
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":1,"column":33},"end":{"line":1,"column":75}}})) != null ? stack1 : "")
    + " "
    + alias2(((helper = (helper = lookupProperty(helpers,"extraClasses") || (depth0 != null ? lookupProperty(depth0,"extraClasses") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"extraClasses","hash":{},"data":data,"loc":{"start":{"line":1,"column":76},"end":{"line":1,"column":92}}}) : helper)))
    + "\" data-id=\""
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\" data-type=\"recommend\" data-invitation-id=\""
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"invitationId") : stack1), depth0))
    + "\">\n  <label>"
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"placeholder") : stack1), depth0))
    + ":</label>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"each","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":2},"end":{"line":7,"column":11}}})) != null ? stack1 : "")
    + "\n  <div class=\"dropdown-container\" style=\"display:none;\"></div>\n  <a href=\"#\" class=\"show-reviewer-dropdown\">Add&hellip;</a>\n  <a href=\"#\" class=\"hide-reviewer-dropdown\" style=\"display:none;\">Done</a>\n</div>\n";
},"useData":true});
templates['tagWidget_text'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "incomplete";
},"3":function(container,depth0,helpers,partials,data) {
    return "      <button class=\"btn btn-default btn-xs btn-link toggle-edit-value\" type=\"button\">Edit</button>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.escapeExpression, alias3=container.lambda, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"tag-widget text "
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":1,"column":28},"end":{"line":1,"column":70}}})) != null ? stack1 : "")
    + " "
    + alias2(((helper = (helper = lookupProperty(helpers,"extraClasses") || (depth0 != null ? lookupProperty(depth0,"extraClasses") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"extraClasses","hash":{},"data":data,"loc":{"start":{"line":1,"column":71},"end":{"line":1,"column":87}}}) : helper)))
    + "\" data-id=\""
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\" data-type=\"text\">\n  <form class=\"form-inline\">\n    <label>"
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"label") : stack1), depth0))
    + "</label>\n    <span class=\"current-value\">"
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"value") : stack1), depth0))
    + "</span>\n    <input type=\"text\" class=\"form-control new-value\" value=\""
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"tag") : depth0)) != null ? lookupProperty(stack1,"value") : stack1), depth0))
    + "\" placeholder=\""
    + alias2(alias3(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"placeholder") : stack1), depth0))
    + "\" style=\"display:none;\">\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"readOnly") : stack1),{"name":"unless","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":4},"end":{"line":8,"column":15}}})) != null ? stack1 : "")
    + "  </form>\n</div>\n";
},"useData":true});
templates['venueHeader'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <h4>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"location") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":4},"end":{"line":10,"column":11}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"date") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":4},"end":{"line":15,"column":11}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"website") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":16,"column":4},"end":{"line":20,"column":11}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"contact") : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":21,"column":4},"end":{"line":25,"column":11}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"groupInfoLink") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":26,"column":4},"end":{"line":30,"column":11}}})) != null ? stack1 : "")
    + "  </h4>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <span class=\"venue-location\">\n        <span class=\"glyphicon glyphicon-globe\" aria-hidden=\"true\"></span> "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"location") || (depth0 != null ? lookupProperty(depth0,"location") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"location","hash":{},"data":data,"loc":{"start":{"line":8,"column":75},"end":{"line":8,"column":87}}}) : helper)))
    + "\n      </span>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <span class=\"venue-date\">\n        <span class=\"glyphicon glyphicon-calendar\" aria-hidden=\"true\"></span> "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"date") || (depth0 != null ? lookupProperty(depth0,"date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"date","hash":{},"data":data,"loc":{"start":{"line":13,"column":78},"end":{"line":13,"column":86}}}) : helper)))
    + "\n      </span>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <span class=\"venue-website\">\n        <span class=\"glyphicon glyphicon-new-window\" aria-hidden=\"true\"></span> <a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"website") || (depth0 != null ? lookupProperty(depth0,"website") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"website","hash":{},"data":data,"loc":{"start":{"line":18,"column":89},"end":{"line":18,"column":100}}}) : helper)))
    + "\" title=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":18,"column":109},"end":{"line":18,"column":118}}}) : helper)))
    + " Homepage\" target=\"_blank\">"
    + alias4((lookupProperty(helpers,"truncate")||(depth0 && lookupProperty(depth0,"truncate"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"website") : depth0),60,{"name":"truncate","hash":{},"data":data,"loc":{"start":{"line":18,"column":145},"end":{"line":18,"column":168}}}))
    + "</a>\n      </span>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <span class=\"venue-contact\">\n        <span class=\"glyphicon glyphicon-envelope\" aria-hidden=\"true\"></span> <a href=\"mailto:"
    + alias4(((helper = (helper = lookupProperty(helpers,"contact") || (depth0 != null ? lookupProperty(depth0,"contact") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"contact","hash":{},"data":data,"loc":{"start":{"line":23,"column":94},"end":{"line":23,"column":105}}}) : helper)))
    + "\" target=\"_blank\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"contact") || (depth0 != null ? lookupProperty(depth0,"contact") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"contact","hash":{},"data":data,"loc":{"start":{"line":23,"column":123},"end":{"line":23,"column":134}}}) : helper)))
    + "</a>\n      </span>\n";
},"10":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <span class=\"venue-info\">\n        <span class=\"glyphicon glyphicon-info-sign\" aria-hidden=\"true\"></span> <a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"groupInfoLink") || (depth0 != null ? lookupProperty(depth0,"groupInfoLink") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"groupInfoLink","hash":{},"data":data,"loc":{"start":{"line":28,"column":88},"end":{"line":28,"column":105}}}) : helper)))
    + "\" title=\"Group Details\">More Info</a>\n      </span>\n";
},"12":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <h4>"
    + alias4(((helper = (helper = lookupProperty(helpers,"location") || (depth0 != null ? lookupProperty(depth0,"location") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"location","hash":{},"data":data,"loc":{"start":{"line":33,"column":6},"end":{"line":33,"column":18}}}) : helper)))
    + "</h4>\n  <h4><a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"website") || (depth0 != null ? lookupProperty(depth0,"website") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"website","hash":{},"data":data,"loc":{"start":{"line":34,"column":15},"end":{"line":34,"column":26}}}) : helper)))
    + "\" target=\"_blank\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"website") || (depth0 != null ? lookupProperty(depth0,"website") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"website","hash":{},"data":data,"loc":{"start":{"line":34,"column":44},"end":{"line":34,"column":55}}}) : helper)))
    + "</a></h4>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"groupInfoLink") : depth0),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":35,"column":2},"end":{"line":37,"column":9}}})) != null ? stack1 : "");
},"13":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <h4><a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"groupInfoLink") || (depth0 != null ? lookupProperty(depth0,"groupInfoLink") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"groupInfoLink","hash":{},"data":data,"loc":{"start":{"line":36,"column":17},"end":{"line":36,"column":34}}}) : helper)))
    + "\" title=\"Group Details\">More Info</a></h4>\n";
},"15":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"instructions") || (depth0 != null ? lookupProperty(depth0,"instructions") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"instructions","hash":{},"data":data,"loc":{"start":{"line":42,"column":4},"end":{"line":42,"column":22}}}) : helper))) != null ? stack1 : "")
    + "\n";
},"17":function(container,depth0,helpers,partials,data) {
    return "    <p class=\"no-margin\">Please see the venue website for more information.</p>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h1>"
    + alias4(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":1,"column":4},"end":{"line":1,"column":13}}}) : helper)))
    + "</h1>\n<h3>"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"subtitle") || (depth0 != null ? lookupProperty(depth0,"subtitle") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"subtitle","hash":{},"data":data,"loc":{"start":{"line":2,"column":4},"end":{"line":2,"column":18}}}) : helper))) != null ? stack1 : "")
    + "</h3>\n\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"noIcons") : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(12, data, 0),"data":data,"loc":{"start":{"line":4,"column":0},"end":{"line":38,"column":11}}})) != null ? stack1 : "")
    + "\n<div class=\"description\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"instructions") : depth0),{"name":"if","hash":{},"fn":container.program(15, data, 0),"inverse":container.program(17, data, 0),"data":data,"loc":{"start":{"line":41,"column":2},"end":{"line":45,"column":9}}})) != null ? stack1 : "")
    + "  <p>"
    + alias4(((helper = (helper = lookupProperty(helpers,"deadline") || (depth0 != null ? lookupProperty(depth0,"deadline") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"deadline","hash":{},"data":data,"loc":{"start":{"line":46,"column":5},"end":{"line":46,"column":17}}}) : helper)))
    + "</p>\n</div>\n";
},"useData":true});
templates['components/submissions'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <h3>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"heading") || (depth0 != null ? lookupProperty(depth0,"heading") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"heading","hash":{},"data":data,"loc":{"start":{"line":2,"column":6},"end":{"line":2,"column":17}}}) : helper)))
    + "</h3>\n  <hr>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <form class=\"form-inline notes-search-form "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"search") : depth0)) != null ? lookupProperty(stack1,"sort") : stack1),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":7,"column":45},"end":{"line":7,"column":96}}})) != null ? stack1 : "")
    + "\" role=\"search\">\n\n    <div class=\"form-group search-content has-feedback\">\n      <input id=\"paper-search-input\" type=\"text\" class=\"form-control\" placeholder=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"search") : depth0)) != null ? lookupProperty(stack1,"placeholder") : stack1), depth0))
    + "\" autocomplete=\"off\">\n      <span class=\"glyphicon glyphicon-search form-control-feedback\" aria-hidden=\"true\"></span>\n    </div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"search") : depth0)) != null ? lookupProperty(stack1,"subjectAreas") : stack1),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":14,"column":4},"end":{"line":27,"column":11}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"search") : depth0)) != null ? lookupProperty(stack1,"sort") : stack1),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":29,"column":4},"end":{"line":39,"column":11}}})) != null ? stack1 : "")
    + "\n    <input type=\"submit\" style=\"display: none;\">\n  </form>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return "notes-search-form-compact";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"form-group subject-area\">\n        <label for=\"subject-area-dropdown\">Subject Area:</label>\n\n"
    + ((stack1 = (lookupProperty(helpers,"is")||(depth0 && lookupProperty(depth0,"is"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"search") : depth0)) != null ? lookupProperty(stack1,"subjectAreaDropdown") : stack1),"basic",{"name":"is","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":8},"end":{"line":25,"column":15}}})) != null ? stack1 : "")
    + "      </div>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <select class=\"subject-area-dropdown form-control\">\n            <option value=\"\" selected>All Subject Areas</option>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"search") : depth0)) != null ? lookupProperty(stack1,"subjectAreas") : stack1),{"name":"each","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":21,"column":12},"end":{"line":23,"column":21}}})) != null ? stack1 : "")
    + "          </select>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "              <option value=\""
    + alias2(alias1(depth0, depth0))
    + "\">"
    + alias2(alias1(depth0, depth0))
    + "</option>\n";
},"10":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"form-group sort-control\">\n        <label for=\"sort-dropdown\">Sort By:</label>\n        <select class=\"sort-dropdown form-control\">\n          <option value=\"Default\">Default</option>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"search") : depth0)) != null ? lookupProperty(stack1,"sort") : stack1),{"name":"each","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":34,"column":10},"end":{"line":36,"column":19}}})) != null ? stack1 : "")
    + "        </select>\n      </div>\n";
},"11":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <option value=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"label") || (depth0 != null ? lookupProperty(depth0,"label") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"label","hash":{},"data":data,"loc":{"start":{"line":35,"column":27},"end":{"line":35,"column":36}}}) : helper)))
    + "\" "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"default") : depth0),{"name":"if","hash":{},"fn":container.program(12, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":35,"column":38},"end":{"line":35,"column":68}}})) != null ? stack1 : "")
    + ">"
    + alias4(((helper = (helper = lookupProperty(helpers,"label") || (depth0 != null ? lookupProperty(depth0,"label") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"label","hash":{},"data":data,"loc":{"start":{"line":35,"column":69},"end":{"line":35,"column":78}}}) : helper)))
    + "</option>\n";
},"12":function(container,depth0,helpers,partials,data) {
    return "selected";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"heading") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":4,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"search") : depth0)) != null ? lookupProperty(stack1,"enabled") : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":0},"end":{"line":44,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"noteList"),depth0,{"name":"noteList","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"usePartial":true,"useData":true});
templates['components/table'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <thead>\n        <tr>\n          "
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"headings") : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":10},"end":{"line":6,"column":79}}})) != null ? stack1 : "")
    + "\n        </tr>\n      </thead>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<th class=\"row-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"index","hash":{},"data":data,"loc":{"start":{"line":6,"column":43},"end":{"line":6,"column":53}}}) : helper)))
    + "\">"
    + ((stack1 = container.lambda(depth0, depth0)) != null ? stack1 : "")
    + "</th>";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <tr>"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"each","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":13,"column":12},"end":{"line":13,"column":54}}})) != null ? stack1 : "")
    + "</tr>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<td>"
    + ((stack1 = container.lambda(depth0, depth0)) != null ? stack1 : "")
    + "</td>";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"table-container\">\n  <table class=\"table table-striped "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"extraClasses") || (depth0 != null ? lookupProperty(depth0,"extraClasses") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"extraClasses","hash":{},"data":data,"loc":{"start":{"line":2,"column":36},"end":{"line":2,"column":52}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"headings") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":4},"end":{"line":9,"column":11}}})) != null ? stack1 : "")
    + "\n    <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"rows") : depth0),{"name":"each","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":12,"column":6},"end":{"line":14,"column":15}}})) != null ? stack1 : "")
    + "    </tbody>\n  </table>\n</div>\n";
},"useData":true});
templates['components/tabs'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <li role=\"presentation\" "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"active") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":5,"column":30},"end":{"line":5,"column":65}}})) != null ? stack1 : "")
    + ">\n        <a href=\"#"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":6,"column":18},"end":{"line":6,"column":24}}}) : helper)))
    + "\" aria-controls=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":6,"column":41},"end":{"line":6,"column":47}}}) : helper)))
    + "\" role=\"tab\" data-toggle=\"tab\" data-tab-index=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data,"loc":{"start":{"line":6,"column":94},"end":{"line":6,"column":104}}}) : helper)))
    + "\" data-modify-history=\"true\">\n          "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"heading") || (depth0 != null ? lookupProperty(depth0,"heading") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"heading","hash":{},"data":data,"loc":{"start":{"line":7,"column":10},"end":{"line":7,"column":23}}}) : helper))) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"headingCount") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":7,"column":23},"end":{"line":7,"column":94}}})) != null ? stack1 : "")
    + "\n        </a>\n      </li>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "class=\"active\"";
},"4":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return " <span class=\"badge\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"headingCount") || (depth0 != null ? lookupProperty(depth0,"headingCount") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"headingCount","hash":{},"data":data,"loc":{"start":{"line":7,"column":64},"end":{"line":7,"column":80}}}) : helper)))
    + "</span>";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div role=\"tabpanel\" class=\"tab-pane fade "
    + alias4(((helper = (helper = lookupProperty(helpers,"extraClasses") || (depth0 != null ? lookupProperty(depth0,"extraClasses") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"extraClasses","hash":{},"data":data,"loc":{"start":{"line":17,"column":46},"end":{"line":17,"column":62}}}) : helper)))
    + " "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"active") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":17,"column":63},"end":{"line":17,"column":93}}})) != null ? stack1 : "")
    + "\" id=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":17,"column":99},"end":{"line":17,"column":105}}}) : helper)))
    + "\">\n      "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"content") || (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"content","hash":{},"data":data,"loc":{"start":{"line":18,"column":6},"end":{"line":18,"column":19}}}) : helper))) != null ? stack1 : "")
    + "\n    </div>\n";
},"7":function(container,depth0,helpers,partials,data) {
    return "in active";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"mobile-full-width\">\n  <ul class=\"nav nav-tabs\" role=\"tablist\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"sections") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":4,"column":4},"end":{"line":10,"column":13}}})) != null ? stack1 : "")
    + "  </ul>\n</div>\n\n<div class=\"tab-content\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"sections") : depth0),{"name":"each","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":16,"column":2},"end":{"line":20,"column":11}}})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true});
templates['partials/accordion'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"id") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":1,"column":25},"end":{"line":1,"column":87}}})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"data":data,"loc":{"start":{"line":1,"column":35},"end":{"line":1,"column":41}}}) : helper)));
},"4":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return alias4(((helper = (helper = lookupProperty(helpers,"parentId") || (depth0 != null ? lookupProperty(depth0,"parentId") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"parentId","hash":{},"data":data,"loc":{"start":{"line":1,"column":49},"end":{"line":1,"column":61}}}) : helper)))
    + "-section-"
    + alias4(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data,"loc":{"start":{"line":1,"column":70},"end":{"line":1,"column":80}}}) : helper)));
},"6":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.lambda, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"panel panel-default\">\n      <div class=\"panel-heading\" role=\"tab\">\n        <h4 class=\"panel-title\">\n          <a class=\"collapse-btn "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])) != null ? lookupProperty(stack1,"collapsed") : stack1),{"name":"if","hash":{},"fn":container.program(7, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":8,"column":33},"end":{"line":8,"column":77}}})) != null ? stack1 : "")
    + "\" role=\"button\"\n             data-toggle=\"collapse\" data-parent=\"#"
    + alias3(alias2(((stack1 = (depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\" href=\"#"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"sectionId"),depth0,{"name":"sectionId","hash":{"parentId":((stack1 = (depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])) != null ? lookupProperty(stack1,"id") : stack1)},"data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "\"\n             aria-controls=\""
    + ((stack1 = container.invokePartial(lookupProperty(partials,"sectionId"),depth0,{"name":"sectionId","hash":{"parentId":((stack1 = (depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])) != null ? lookupProperty(stack1,"id") : stack1)},"data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "\">\n            <span class=\"glyphicon glyphicon-triangle-bottom\"></span>\n          </a>\n          <a class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])) != null ? lookupProperty(stack1,"collapsed") : stack1),{"name":"if","hash":{},"fn":container.program(7, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":13,"column":20},"end":{"line":13,"column":64}}})) != null ? stack1 : "")
    + "\" role=\"button\"\n             data-toggle=\"collapse\" data-parent=\"#"
    + alias3(alias2(((stack1 = (depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\" href=\"#"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"sectionId"),depth0,{"name":"sectionId","hash":{"parentId":((stack1 = (depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])) != null ? lookupProperty(stack1,"id") : stack1)},"data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "\"\n             aria-controls=\""
    + ((stack1 = container.invokePartial(lookupProperty(partials,"sectionId"),depth0,{"name":"sectionId","hash":{"parentId":((stack1 = (depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])) != null ? lookupProperty(stack1,"id") : stack1)},"data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "\">\n            "
    + alias3(((helper = (helper = lookupProperty(helpers,"heading") || (depth0 != null ? lookupProperty(depth0,"heading") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"heading","hash":{},"data":data,"loc":{"start":{"line":16,"column":12},"end":{"line":16,"column":23}}}) : helper)))
    + "\n          </a>\n        </h4>\n      </div>\n      <div id=\""
    + ((stack1 = container.invokePartial(lookupProperty(partials,"sectionId"),depth0,{"name":"sectionId","hash":{"parentId":((stack1 = (depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])) != null ? lookupProperty(stack1,"id") : stack1)},"data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "\" class=\"panel-collapse collapse "
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])) != null ? lookupProperty(stack1,"collapsed") : stack1),{"name":"unless","hash":{},"fn":container.program(9, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":20,"column":86},"end":{"line":20,"column":131}}})) != null ? stack1 : "")
    + "\" role=\"tabpanel\">\n        <div class=\"panel-body\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])) != null ? lookupProperty(stack1,"html") : stack1),{"name":"if","hash":{},"fn":container.program(11, data, 0, blockParams, depths),"inverse":container.program(13, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":22,"column":10},"end":{"line":26,"column":17}}})) != null ? stack1 : "")
    + "        </div>\n      </div>\n    </div>\n    <hr class=\"webfield-accordion-divider\">\n";
},"7":function(container,depth0,helpers,partials,data) {
    return "collapsed";
},"9":function(container,depth0,helpers,partials,data) {
    return "in";
},"11":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"body") || (depth0 != null ? lookupProperty(depth0,"body") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"body","hash":{},"data":data,"loc":{"start":{"line":23,"column":12},"end":{"line":23,"column":22}}}) : helper))) != null ? stack1 : "")
    + "\n";
},"13":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <p>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"body") || (depth0 != null ? lookupProperty(depth0,"body") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"body","hash":{},"data":data,"loc":{"start":{"line":25,"column":15},"end":{"line":25,"column":23}}}) : helper)))
    + "</p>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n\n<div class=\"panel-group webfield-accordion "
    + alias2(((helper = (helper = lookupProperty(helpers,"extraClasses") || (depth0 != null ? lookupProperty(depth0,"extraClasses") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"extraClasses","hash":{},"data":data,"loc":{"start":{"line":3,"column":43},"end":{"line":3,"column":59}}}) : helper)))
    + "\" id=\""
    + alias2(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\" role=\"tablist\" aria-multiselectable=\"true\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"sections") : depth0),{"name":"each","hash":{},"fn":container.program(6, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":4,"column":2},"end":{"line":31,"column":11}}})) != null ? stack1 : "")
    + "</div>\n";
},"main_d":  function(fn, props, container, depth0, data, blockParams, depths) {

  var decorators = container.decorators, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  fn = lookupProperty(decorators,"inline")(fn,props,container,{"name":"inline","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"args":["sectionId"],"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":98}}}) || fn;
  return fn;
  }

,"useDecorators":true,"usePartial":true,"useData":true,"useDepths":true});
templates['partials/activityList'] = template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <li class=\"note note-activity "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isDeleted") : stack1),{"name":"if","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":34},"end":{"line":3,"column":73}}})) != null ? stack1 : "")
    + "\" data-id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":3,"column":84},"end":{"line":3,"column":90}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"isEqual")||(depth0 && lookupProperty(depth0,"isEqual"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"version") : depth0),2,{"name":"isEqual","hash":{},"data":data,"loc":{"start":{"line":4,"column":10},"end":{"line":4,"column":29}}}),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.program(6, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":4,"column":4},"end":{"line":8,"column":11}}})) != null ? stack1 : "")
    + "    </li>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "trashed";
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"noteActivityV2"),depth0,{"name":"noteActivityV2","hash":{"options":(depths[1] != null ? lookupProperty(depths[1],"activityOptions") : depths[1])},"data":data,"indent":"      ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"6":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"noteActivity"),depth0,{"name":"noteActivity","hash":{"options":(depths[1] != null ? lookupProperty(depths[1],"activityOptions") : depths[1])},"data":data,"indent":"      ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <li><p class=\"empty-message\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"activityOptions") : depth0)) != null ? lookupProperty(stack1,"emptyMessage") : stack1), depth0))
    + "</p></li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"list-unstyled submissions-list activity-list\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"notes") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.program(8, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":2,"column":2},"end":{"line":12,"column":11}}})) != null ? stack1 : "")
    + "</ul>\n";
},"usePartial":true,"useData":true,"useDepths":true});
templates['partials/forumLinkModal'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id=\"permalink-modal\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\" >\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n      <div class=\"modal-body\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n        <p>Link directly to this comment by sharing the URL below:</p>\n        <div class=\"input-group\">\n          <span class=\"input-group-addon\" id=\"basic-addon1\">\n            <span class=\"glyphicon glyphicon-link\" aria-hidden=\"true\"></span>\n          </span>\n          <input type=\"text\" class=\"form-control\" placeholder=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"permalinkUrl") || (depth0 != null ? lookupProperty(depth0,"permalinkUrl") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"permalinkUrl","hash":{},"data":data,"loc":{"start":{"line":11,"column":63},"end":{"line":11,"column":79}}}) : helper)))
    + "\" value=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"permalinkUrl") || (depth0 != null ? lookupProperty(depth0,"permalinkUrl") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"permalinkUrl","hash":{},"data":data,"loc":{"start":{"line":11,"column":88},"end":{"line":11,"column":104}}}) : helper)))
    + "\">\n        </div>\n      </div>\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n      </div>\n    </div>\n  </div>\n</div>\n";
},"useData":true});
templates['partials/multiselectorDropdown'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <li class=\"select-all-item\">\n        <label>\n          <input class=\"select-all-checkbox\" type=\"checkbox\" "
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"defaultUnchecked") : depth0),{"name":"unless","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":61},"end":{"line":11,"column":107}}})) != null ? stack1 : "")
    + "/> Select All\n        </label>\n      </li>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "checked";
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=container.escapeExpression, alias2=depth0 != null ? depth0 : (container.nullContext || {}), alias3=container.hooks.helperMissing, alias4="function", lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <li>\n        <label>\n          <input class=\""
    + alias1(container.lambda((depths[1] != null ? lookupProperty(depths[1],"id") : depths[1]), depth0))
    + "-multiselector-checkbox\" type=\"checkbox\" value=\""
    + alias1(((helper = (helper = lookupProperty(helpers,"valueFilter") || (depth0 != null ? lookupProperty(depth0,"valueFilter") : depth0)) != null ? helper : alias3),(typeof helper === alias4 ? helper.call(alias2,{"name":"valueFilter","hash":{},"data":data,"loc":{"start":{"line":18,"column":81},"end":{"line":18,"column":96}}}) : helper)))
    + "\" "
    + ((stack1 = lookupProperty(helpers,"unless").call(alias2,(depths[1] != null ? lookupProperty(depths[1],"defaultUnchecked") : depths[1]),{"name":"unless","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":98},"end":{"line":18,"column":147}}})) != null ? stack1 : "")
    + "/> "
    + alias1(((helper = (helper = lookupProperty(helpers,"textFilter") || (depth0 != null ? lookupProperty(depth0,"textFilter") : depth0)) != null ? helper : alias3),(typeof helper === alias4 ? helper.call(alias2,{"name":"textFilter","hash":{},"data":data,"loc":{"start":{"line":18,"column":150},"end":{"line":18,"column":164}}}) : helper)))
    + "\n        </label>\n      </li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"multiselector dropdown\">\n  <button class=\"form-control dropdown-toggle\" type=\"button\"\n          id=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":3,"column":14},"end":{"line":3,"column":20}}}) : helper)))
    + "\" data-toggle=\"dropdown\"\n          aria-haspopup=\"true\" aria-expanded=\"true\">\n          "
    + alias4(((helper = (helper = lookupProperty(helpers,"buttonText") || (depth0 != null ? lookupProperty(depth0,"buttonText") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"buttonText","hash":{},"data":data,"loc":{"start":{"line":5,"column":10},"end":{"line":5,"column":24}}}) : helper)))
    + "\n  </button>\n  <ul class=\"dropdown-menu checkbox-menu allow-focus\" aria-labelledby=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":7,"column":71},"end":{"line":7,"column":77}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"hideSelectAll") : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":8,"column":4},"end":{"line":14,"column":15}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"htmlFilters") : depth0),{"name":"each","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":15,"column":4},"end":{"line":21,"column":13}}})) != null ? stack1 : "")
    + "  </ul>\n</div>\n";
},"useData":true,"useDepths":true});
templates['partials/noteActivity'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"formattedSignature") : stack1), depth0))
    + "\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <span class=\"sig\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"formattedSignature") : stack1), depth0))
    + "</span>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "edited a";
},"7":function(container,depth0,helpers,partials,data) {
    return "posted a new";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "to <a href=\"/group?id="
    + alias1(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"group") : stack1), depth0))
    + "\">"
    + alias1((lookupProperty(helpers,"prettyId")||(depth0 && lookupProperty(depth0,"prettyId"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"group") : stack1),{"name":"prettyId","hash":{},"data":data,"loc":{"start":{"line":9,"column":70},"end":{"line":9,"column":96}}}))
    + "</a>";
},"11":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression((lookupProperty(helpers,"forumReadersIcon")||(depth0 && lookupProperty(depth0,"forumReadersIcon"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"readers") : depth0),{"name":"forumReadersIcon","hash":{},"data":data,"loc":{"start":{"line":11,"column":35},"end":{"line":11,"column":63}}}))
    + " &nbsp;&bull;&nbsp;";
},"13":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&noteId="
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"data":data,"loc":{"start":{"line":17,"column":69},"end":{"line":17,"column":75}}}) : helper)));
},"15":function(container,depth0,helpers,partials,data) {
    return "[Deleted]";
},"17":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "\n";
},"19":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          "
    + container.escapeExpression((lookupProperty(helpers,"noteTitle")||(depth0 && lookupProperty(depth0,"noteTitle"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"invitation") : depth0),(depth0 != null ? lookupProperty(depth0,"signatures") : depth0),{"name":"noteTitle","hash":{},"data":data,"loc":{"start":{"line":22,"column":10},"end":{"line":22,"column":45}}}))
    + "\n";
},"21":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"note-authors\">\n        "
    + container.escapeExpression((lookupProperty(helpers,"noteAuthors")||(depth0 && lookupProperty(depth0,"noteAuthors"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"content") : depth0),(depth0 != null ? lookupProperty(depth0,"signatures") : depth0),(depth0 != null ? lookupProperty(depth0,"details") : depth0),{"name":"noteAuthors","hash":{},"data":data,"loc":{"start":{"line":29,"column":8},"end":{"line":29,"column":50}}}))
    + "\n      </div>\n";
},"23":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"parent-title\">\n        <span class=\"glyphicon glyphicon-share-alt\"></span>\n        <span class=\"title\">\n"
    + ((stack1 = lookupProperty(helpers,"with").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"forumContent") : stack1),{"name":"with","hash":{},"fn":container.program(24, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":35,"column":10},"end":{"line":37,"column":19}}})) != null ? stack1 : "")
    + "        </span>\n      </div>\n";
},"24":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"title") : depth0),{"name":"if","hash":{},"fn":container.program(25, data, 0),"inverse":container.program(27, data, 0),"data":data,"loc":{"start":{"line":36,"column":12},"end":{"line":36,"column":57}}})) != null ? stack1 : "")
    + "\n";
},"25":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"data":data,"loc":{"start":{"line":36,"column":25},"end":{"line":36,"column":34}}}) : helper)));
},"27":function(container,depth0,helpers,partials,data) {
    return "No Title";
},"29":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"writable") : stack1),{"name":"if","hash":{},"fn":container.program(30, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":44,"column":37},"end":{"line":54,"column":11}}})) != null ? stack1 : "");
},"30":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isDeleted") : stack1),{"name":"unless","hash":{},"fn":container.program(31, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":45,"column":6},"end":{"line":47,"column":17}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isDeleted") : stack1),{"name":"unless","hash":{},"fn":container.program(33, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":48,"column":6},"end":{"line":50,"column":17}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isDeleted") : stack1),{"name":"if","hash":{},"fn":container.program(35, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":51,"column":6},"end":{"line":53,"column":13}}})) != null ? stack1 : "")
    + "    ";
},"31":function(container,depth0,helpers,partials,data) {
    return "        <button class=\"btn btn-xs note-action-edit\"><span class=\"glyphicon glyphicon-edit\" aria-hidden=\"true\"></span></button>\n";
},"33":function(container,depth0,helpers,partials,data) {
    return "        <button class=\"btn btn-xs note-action-trash\"><span class=\"glyphicon glyphicon-trash\" aria-hidden=\"true\"></span></button>\n";
},"35":function(container,depth0,helpers,partials,data) {
    return "        <button class=\"btn btn-xs note-action-restore\">Restore</button>\n";
},"37":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showContents") : stack1),{"name":"if","hash":{},"fn":container.program(38, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":60,"column":2},"end":{"line":62,"column":9}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showTags") : stack1),{"name":"if","hash":{},"fn":container.program(40, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":64,"column":2},"end":{"line":66,"column":9}}})) != null ? stack1 : "")
    + "\n";
},"38":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    "
    + container.escapeExpression((lookupProperty(helpers,"noteContentCollapsible")||(depth0 && lookupProperty(depth0,"noteContentCollapsible"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"noteContentCollapsible","hash":{},"data":data,"loc":{"start":{"line":61,"column":4},"end":{"line":61,"column":35}}}))
    + "\n";
},"40":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    "
    + container.escapeExpression((lookupProperty(helpers,"tagWidgets")||(depth0 && lookupProperty(depth0,"tagWidgets"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"tags") : stack1),((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"tagInvitations") : stack1),{"name":"tagWidgets","hash":{},"data":data,"loc":{"start":{"line":65,"column":4},"end":{"line":65,"column":54}}}))
    + "\n";
},"42":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showContents") : stack1),{"name":"if","hash":{},"fn":container.program(43, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":70,"column":2},"end":{"line":72,"column":9}}})) != null ? stack1 : "")
    + "\n";
},"43":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    "
    + container.escapeExpression((lookupProperty(helpers,"noteContentCollapsible")||(depth0 && lookupProperty(depth0,"noteContentCollapsible"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"noteContentCollapsible","hash":{"noCollapse":"true"},"data":data,"loc":{"start":{"line":71,"column":4},"end":{"line":71,"column":53}}}))
    + "\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"activity-heading clearfix\">\n  <div class=\"explanation\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"userIsSignatory") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":3,"column":4},"end":{"line":7,"column":11}}})) != null ? stack1 : "")
    + "    "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isUpdated") : stack1),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(7, data, 0),"data":data,"loc":{"start":{"line":8,"column":4},"end":{"line":8,"column":64}}})) != null ? stack1 : "")
    + " "
    + alias3((lookupProperty(helpers,"prettyInvitationId")||(depth0 && lookupProperty(depth0,"prettyInvitationId"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"invitation") : depth0),{"name":"prettyInvitationId","hash":{},"data":data,"loc":{"start":{"line":8,"column":65},"end":{"line":8,"column":98}}}))
    + "\n    "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showGroup") : stack1),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":9,"column":4},"end":{"line":9,"column":107}}})) != null ? stack1 : "")
    + "\n  </div>\n  <div class=\"date\">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"readers") : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":20},"end":{"line":11,"column":89}}})) != null ? stack1 : "")
    + " "
    + alias3((lookupProperty(helpers,"timeAgo")||(depth0 && lookupProperty(depth0,"timeAgo"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"tmdate") : depth0),{"name":"timeAgo","hash":{},"data":data,"loc":{"start":{"line":11,"column":90},"end":{"line":11,"column":108}}}))
    + " ago</div>\n</div>\n\n<div class=\"clearfix\">\n  <div class=\"activity-title\">\n    <h4>\n      <a href=\"/forum?id="
    + alias3(((helper = (helper = lookupProperty(helpers,"forum") || (depth0 != null ? lookupProperty(depth0,"forum") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"forum","hash":{},"data":data,"loc":{"start":{"line":17,"column":25},"end":{"line":17,"column":34}}}) : helper)))
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isForum") : stack1),{"name":"unless","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":17,"column":34},"end":{"line":17,"column":86}}})) != null ? stack1 : "")
    + "\">\n        "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isDeleted") : stack1),{"name":"if","hash":{},"fn":container.program(15, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":8},"end":{"line":18,"column":49}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"title") : stack1),{"name":"if","hash":{},"fn":container.program(17, data, 0),"inverse":container.program(19, data, 0),"data":data,"loc":{"start":{"line":19,"column":8},"end":{"line":23,"column":15}}})) != null ? stack1 : "")
    + "      </a>\n    </h4>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isForum") : stack1),{"name":"if","hash":{},"fn":container.program(21, data, 0),"inverse":container.program(23, data, 0),"data":data,"loc":{"start":{"line":27,"column":4},"end":{"line":40,"column":11}}})) != null ? stack1 : "")
    + "  </div>\n\n  <div class=\"activity-actions\">\n    "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showActionButtons") : stack1),{"name":"if","hash":{},"fn":container.program(29, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":44,"column":4},"end":{"line":54,"column":18}}})) != null ? stack1 : "")
    + "\n  </div>\n</div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isForum") : stack1),{"name":"if","hash":{},"fn":container.program(37, data, 0),"inverse":container.program(42, data, 0),"data":data,"loc":{"start":{"line":58,"column":0},"end":{"line":74,"column":7}}})) != null ? stack1 : "");
},"useData":true});
templates['partials/noteActivityV2'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"formattedSignature") : stack1), depth0))
    + "\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <span class=\"sig\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"formattedSignature") : stack1), depth0))
    + "</span>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "edited a";
},"7":function(container,depth0,helpers,partials,data) {
    return "posted a new";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "to <a href=\"/group?id="
    + alias1(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"group") : stack1), depth0))
    + "\">"
    + alias1((lookupProperty(helpers,"prettyId")||(depth0 && lookupProperty(depth0,"prettyId"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"group") : stack1),{"name":"prettyId","hash":{},"data":data,"loc":{"start":{"line":9,"column":70},"end":{"line":9,"column":96}}}))
    + "</a>";
},"11":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression((lookupProperty(helpers,"forumReadersIcon")||(depth0 && lookupProperty(depth0,"forumReadersIcon"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"readers") : depth0),{"name":"forumReadersIcon","hash":{},"data":data,"loc":{"start":{"line":11,"column":35},"end":{"line":11,"column":63}}}))
    + " &nbsp;&bull;&nbsp;";
},"13":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&noteId="
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"data":data,"loc":{"start":{"line":17,"column":69},"end":{"line":17,"column":75}}}) : helper)));
},"15":function(container,depth0,helpers,partials,data) {
    return "[Deleted]";
},"17":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          "
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"title") : stack1)) != null ? lookupProperty(stack1,"value") : stack1), depth0))
    + "\n";
},"19":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          "
    + container.escapeExpression((lookupProperty(helpers,"noteTitle")||(depth0 && lookupProperty(depth0,"noteTitle"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"invitations") : depth0)) != null ? lookupProperty(stack1,"0") : stack1),(depth0 != null ? lookupProperty(depth0,"signatures") : depth0),{"name":"noteTitle","hash":{},"data":data,"loc":{"start":{"line":22,"column":10},"end":{"line":22,"column":50}}}))
    + "\n";
},"21":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"note-authors\">\n        "
    + container.escapeExpression((lookupProperty(helpers,"noteAuthorsV2")||(depth0 && lookupProperty(depth0,"noteAuthorsV2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"readers") : depth0),(depth0 != null ? lookupProperty(depth0,"content") : depth0),(depth0 != null ? lookupProperty(depth0,"signatures") : depth0),{"name":"noteAuthorsV2","hash":{},"data":data,"loc":{"start":{"line":29,"column":8},"end":{"line":29,"column":52}}}))
    + "\n      </div>\n";
},"23":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"parent-title\">\n        <span class=\"glyphicon glyphicon-share-alt\"></span>\n        <span class=\"title\">\n"
    + ((stack1 = lookupProperty(helpers,"with").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"forumContent") : stack1),{"name":"with","hash":{},"fn":container.program(24, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":35,"column":10},"end":{"line":37,"column":19}}})) != null ? stack1 : "")
    + "        </span>\n      </div>\n";
},"24":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"if","hash":{},"fn":container.program(25, data, 0),"inverse":container.program(27, data, 0),"data":data,"loc":{"start":{"line":36,"column":12},"end":{"line":36,"column":69}}})) != null ? stack1 : "")
    + "\n";
},"25":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? lookupProperty(stack1,"value") : stack1), depth0));
},"27":function(container,depth0,helpers,partials,data) {
    return "No Title";
},"29":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showContents") : stack1),{"name":"if","hash":{},"fn":container.program(30, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":46,"column":2},"end":{"line":48,"column":9}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showTags") : stack1),{"name":"if","hash":{},"fn":container.program(32, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":50,"column":2},"end":{"line":52,"column":9}}})) != null ? stack1 : "")
    + "\n";
},"30":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    "
    + container.escapeExpression((lookupProperty(helpers,"noteContentCollapsible")||(depth0 && lookupProperty(depth0,"noteContentCollapsible"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"noteContentCollapsible","hash":{},"data":data,"loc":{"start":{"line":47,"column":4},"end":{"line":47,"column":35}}}))
    + "\n";
},"32":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    "
    + container.escapeExpression((lookupProperty(helpers,"tagWidgets")||(depth0 && lookupProperty(depth0,"tagWidgets"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"tags") : stack1),((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"tagInvitations") : stack1),{"name":"tagWidgets","hash":{},"data":data,"loc":{"start":{"line":51,"column":4},"end":{"line":51,"column":54}}}))
    + "\n";
},"34":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showContents") : stack1),{"name":"if","hash":{},"fn":container.program(35, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":56,"column":2},"end":{"line":58,"column":9}}})) != null ? stack1 : "")
    + "\n";
},"35":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    "
    + container.escapeExpression((lookupProperty(helpers,"noteContentCollapsible")||(depth0 && lookupProperty(depth0,"noteContentCollapsible"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"noteContentCollapsible","hash":{"noCollapse":"true"},"data":data,"loc":{"start":{"line":57,"column":4},"end":{"line":57,"column":53}}}))
    + "\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"activity-heading clearfix\">\n  <div class=\"explanation\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"userIsSignatory") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":3,"column":4},"end":{"line":7,"column":11}}})) != null ? stack1 : "")
    + "    "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isUpdated") : stack1),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(7, data, 0),"data":data,"loc":{"start":{"line":8,"column":4},"end":{"line":8,"column":64}}})) != null ? stack1 : "")
    + " "
    + alias3((lookupProperty(helpers,"prettyInvitationId")||(depth0 && lookupProperty(depth0,"prettyInvitationId"))||alias2).call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"invitations") : depth0)) != null ? lookupProperty(stack1,"0") : stack1),{"name":"prettyInvitationId","hash":{},"data":data,"loc":{"start":{"line":8,"column":65},"end":{"line":8,"column":103}}}))
    + "\n    "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showGroup") : stack1),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":9,"column":4},"end":{"line":9,"column":107}}})) != null ? stack1 : "")
    + "\n  </div>\n  <div class=\"date\">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"readers") : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":20},"end":{"line":11,"column":89}}})) != null ? stack1 : "")
    + " "
    + alias3((lookupProperty(helpers,"timeAgo")||(depth0 && lookupProperty(depth0,"timeAgo"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"tmdate") : depth0),{"name":"timeAgo","hash":{},"data":data,"loc":{"start":{"line":11,"column":90},"end":{"line":11,"column":108}}}))
    + " ago</div>\n</div>\n\n<div class=\"clearfix\">\n  <div class=\"activity-title\">\n    <h4>\n      <a href=\"/forum?id="
    + alias3(((helper = (helper = lookupProperty(helpers,"forum") || (depth0 != null ? lookupProperty(depth0,"forum") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"forum","hash":{},"data":data,"loc":{"start":{"line":17,"column":25},"end":{"line":17,"column":34}}}) : helper)))
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isForum") : stack1),{"name":"unless","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":17,"column":34},"end":{"line":17,"column":86}}})) != null ? stack1 : "")
    + "\">\n        "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isDeleted") : stack1),{"name":"if","hash":{},"fn":container.program(15, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":8},"end":{"line":18,"column":49}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"title") : stack1)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"if","hash":{},"fn":container.program(17, data, 0),"inverse":container.program(19, data, 0),"data":data,"loc":{"start":{"line":19,"column":8},"end":{"line":23,"column":15}}})) != null ? stack1 : "")
    + "      </a>\n    </h4>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isForum") : stack1),{"name":"if","hash":{},"fn":container.program(21, data, 0),"inverse":container.program(23, data, 0),"data":data,"loc":{"start":{"line":27,"column":4},"end":{"line":40,"column":11}}})) != null ? stack1 : "")
    + "  </div>\n</div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"isForum") : stack1),{"name":"if","hash":{},"fn":container.program(29, data, 0),"inverse":container.program(34, data, 0),"data":data,"loc":{"start":{"line":44,"column":0},"end":{"line":60,"column":7}}})) != null ? stack1 : "");
},"useData":true});
templates['partials/noteBasic'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"path") : stack1), depth0));
},"3":function(container,depth0,helpers,partials,data) {
    return "forum";
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&noteId="
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"data":data,"loc":{"start":{"line":3,"column":107},"end":{"line":3,"column":113}}}) : helper)));
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&referrer="
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"referrer") : stack1), depth0));
},"9":function(container,depth0,helpers,partials,data) {
    return "target=\"_blank\"";
},"11":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "\n";
},"13":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      "
    + container.escapeExpression((lookupProperty(helpers,"noteTitle")||(depth0 && lookupProperty(depth0,"noteTitle"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"invitation") : depth0),(depth0 != null ? lookupProperty(depth0,"signatures") : depth0),{"name":"noteTitle","hash":{},"data":data,"loc":{"start":{"line":7,"column":6},"end":{"line":7,"column":41}}}))
    + "\n";
},"15":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"pdf") : stack1),{"name":"if","hash":{},"fn":container.program(16, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":25},"end":{"line":13,"column":9}}})) != null ? stack1 : "");
},"16":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n    <a href=\""
    + container.escapeExpression((lookupProperty(helpers,"pdfUrl")||(depth0 && lookupProperty(depth0,"pdfUrl"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,false,{"name":"pdfUrl","hash":{},"data":data,"loc":{"start":{"line":12,"column":13},"end":{"line":12,"column":34}}}))
    + "\" class=\"pdf-link\" title=\"Download PDF\" target=\"_blank\"><img src=\"/images/pdf_icon_blue.svg\"></a>\n  ";
},"18":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"ee") : stack1),{"name":"if","hash":{},"fn":container.program(19, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":14,"column":26},"end":{"line":16,"column":9}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"html") : stack1),{"name":"if","hash":{},"fn":container.program(21, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":17,"column":2},"end":{"line":19,"column":9}}})) != null ? stack1 : "");
},"19":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n    <a href=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"ee") : stack1), depth0))
    + "\" class=\"html-link\" title=\"Open Website\" target=\"_blank\"><img src=\"/images/html_icon_blue.svg\"></a>\n";
},"21":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <a href=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"html") : stack1), depth0))
    + "\" class=\"html-link\" title=\"Open Website\" target=\"_blank\"><img src=\"/images/html_icon_blue.svg\"></a>\n  ";
},"23":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = (lookupProperty(helpers,"isnt")||(depth0 && lookupProperty(depth0,"isnt"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"id") : depth0),(depth0 != null ? lookupProperty(depth0,"forum") : depth0),{"name":"isnt","hash":{},"fn":container.program(24, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":22,"column":28},"end":{"line":31,"column":9}}})) != null ? stack1 : "");
},"24":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n<div class=\"parent-title\">\n  <span class=\"glyphicon glyphicon-share-alt\"></span>\n  <span class=\"title\">\n"
    + ((stack1 = lookupProperty(helpers,"with").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"forumContent") : stack1),{"name":"with","hash":{},"fn":container.program(25, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":26,"column":4},"end":{"line":28,"column":13}}})) != null ? stack1 : "")
    + "  </span>\n</div>\n";
},"25":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"title") : depth0),{"name":"if","hash":{},"fn":container.program(26, data, 0),"inverse":container.program(28, data, 0),"data":data,"loc":{"start":{"line":27,"column":6},"end":{"line":27,"column":51}}})) != null ? stack1 : "")
    + "\n";
},"26":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"data":data,"loc":{"start":{"line":27,"column":19},"end":{"line":27,"column":28}}}) : helper)));
},"28":function(container,depth0,helpers,partials,data) {
    return "No Title";
},"30":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"venue") : stack1),{"name":"if","hash":{},"fn":container.program(31, data, 0),"inverse":container.program(33, data, 0),"data":data,"loc":{"start":{"line":40,"column":4},"end":{"line":44,"column":11}}})) != null ? stack1 : "");
},"31":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <span class=\"item\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"venue") : stack1), depth0))
    + "</span>\n";
},"33":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <span class=\"item\">"
    + container.escapeExpression((lookupProperty(helpers,"prettyId")||(depth0 && lookupProperty(depth0,"prettyId"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"invitation") : depth0),{"name":"prettyId","hash":{},"data":data,"loc":{"start":{"line":43,"column":25},"end":{"line":43,"column":48}}}))
    + "</span>\n";
},"35":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"readers") : depth0),{"name":"if","hash":{},"fn":container.program(36, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":46,"column":29},"end":{"line":48,"column":9}}})) != null ? stack1 : "");
},"36":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n    <span class=\"item readers\">Readers: "
    + container.escapeExpression((lookupProperty(helpers,"forumReaders")||(depth0 && lookupProperty(depth0,"forumReaders"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"readers") : depth0),{"name":"forumReaders","hash":{},"data":data,"loc":{"start":{"line":47,"column":40},"end":{"line":47,"column":64}}}))
    + "</span>\n  ";
},"38":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = (lookupProperty(helpers,"isnt")||(depth0 && lookupProperty(depth0,"isnt"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replyCount") : stack1),undefined,{"name":"isnt","hash":{},"fn":container.program(39, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":49,"column":28},"end":{"line":51,"column":11}}})) != null ? stack1 : "");
},"39":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n    <span class=\"item\">"
    + container.escapeExpression((lookupProperty(helpers,"inflect")||(depth0 && lookupProperty(depth0,"inflect"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replyCount") : stack1),"Reply","Replies",true,{"name":"inflect","hash":{},"data":data,"loc":{"start":{"line":50,"column":23},"end":{"line":50,"column":76}}}))
    + "</span>\n  ";
},"41":function(container,depth0,helpers,partials,data) {
    return "    <span class=\"warning-conflict\">Conflict</span>\n";
},"43":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"writable") : stack1),{"name":"if","hash":{},"fn":container.program(44, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":55,"column":35},"end":{"line":67,"column":9}}})) != null ? stack1 : "");
},"44":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n    <span class=\"note-actions\">\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"isDeleted") : depth0),{"name":"unless","hash":{},"fn":container.program(45, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":57,"column":6},"end":{"line":59,"column":17}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"isDeleted") : depth0),{"name":"unless","hash":{},"fn":container.program(47, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":60,"column":6},"end":{"line":62,"column":17}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"isDeleted") : depth0),{"name":"if","hash":{},"fn":container.program(49, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":63,"column":6},"end":{"line":65,"column":13}}})) != null ? stack1 : "")
    + "    </span>\n  ";
},"45":function(container,depth0,helpers,partials,data) {
    return "        <button class=\"btn btn-xs note-action-edit\"><span class=\"glyphicon glyphicon-edit\" aria-hidden=\"true\"></span></button>\n";
},"47":function(container,depth0,helpers,partials,data) {
    return "        <button class=\"btn btn-xs note-action-trash\"><span class=\"glyphicon glyphicon-trash\" aria-hidden=\"true\"></span></button>\n";
},"49":function(container,depth0,helpers,partials,data) {
    return "        <button class=\"btn btn-xs note-action-restore\">Restore</button>\n";
},"51":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  "
    + container.escapeExpression((lookupProperty(helpers,"noteContentCollapsible")||(depth0 && lookupProperty(depth0,"noteContentCollapsible"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"noteContentCollapsible","hash":{},"data":data,"loc":{"start":{"line":71,"column":2},"end":{"line":71,"column":33}}}))
    + "\n";
},"53":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  "
    + container.escapeExpression((lookupProperty(helpers,"tagWidgets")||(depth0 && lookupProperty(depth0,"tagWidgets"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"tags") : stack1),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"tagInvitations") : stack1),((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"tagInvitations") : stack1),{"name":"tagWidgets","hash":{},"data":data,"loc":{"start":{"line":75,"column":2},"end":{"line":75,"column":75}}}))
    + "\n";
},"55":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  "
    + container.escapeExpression((lookupProperty(helpers,"tagWidgets")||(depth0 && lookupProperty(depth0,"tagWidgets"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"edges") : stack1),((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"edgeInvitations") : stack1),{"name":"tagWidgets","hash":{},"data":data,"loc":{"start":{"line":79,"column":2},"end":{"line":79,"column":54}}}))
    + "\n";
},"57":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"taskInvitation") : depth0),{"name":"if","hash":{},"fn":container.program(58, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":82,"column":25},"end":{"line":89,"column":7}}})) != null ? stack1 : "");
},"58":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n  <div class=\"note-task\">\n    <a href=\"/forum?id="
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"taskInvitation") : depth0)) != null ? lookupProperty(stack1,"reply") : stack1)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + "&noteId="
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"taskInvitation") : depth0)) != null ? lookupProperty(stack1,"reply") : stack1)) != null ? lookupProperty(stack1,"replyTo") : stack1), depth0))
    + "&invitationId="
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"taskInvitation") : depth0)) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"referrer") : stack1),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":84,"column":128},"end":{"line":84,"column":189}}})) != null ? stack1 : "")
    + "\">\n      "
    + alias2((lookupProperty(helpers,"prettyInvitationId")||(depth0 && lookupProperty(depth0,"prettyInvitationId"))||container.hooks.helperMissing).call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"taskInvitation") : depth0)) != null ? lookupProperty(stack1,"id") : stack1),{"name":"prettyInvitationId","hash":{},"data":data,"loc":{"start":{"line":85,"column":6},"end":{"line":85,"column":46}}}))
    + "\n    </a>\n    <span class=\"duedate "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"taskInvitation") : depth0)) != null ? lookupProperty(stack1,"dueDateStatus") : stack1), depth0))
    + "\">Due: "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"taskInvitation") : depth0)) != null ? lookupProperty(stack1,"dueDateStr") : stack1), depth0))
    + "</span>\n  </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h4>\n  <a href=\"/"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"path") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":3,"column":12},"end":{"line":3,"column":68}}})) != null ? stack1 : "")
    + "?id="
    + alias3(((helper = (helper = lookupProperty(helpers,"forum") || (depth0 != null ? lookupProperty(depth0,"forum") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"forum","hash":{},"data":data,"loc":{"start":{"line":3,"column":72},"end":{"line":3,"column":81}}}) : helper)))
    + ((stack1 = (lookupProperty(helpers,"isnt")||(depth0 && lookupProperty(depth0,"isnt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"id") : depth0),(depth0 != null ? lookupProperty(depth0,"forum") : depth0),{"name":"isnt","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":81},"end":{"line":3,"column":122}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"referrer") : stack1),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":122},"end":{"line":3,"column":183}}})) != null ? stack1 : "")
    + "\" "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"openInNewTab") : stack1),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":185},"end":{"line":3,"column":235}}})) != null ? stack1 : "")
    + ">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"title") : stack1),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.program(13, data, 0),"data":data,"loc":{"start":{"line":4,"column":4},"end":{"line":8,"column":11}}})) != null ? stack1 : "")
    + "  </a>\n\n  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"pdfLink") : stack1),{"name":"if","hash":{},"fn":container.program(15, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":2},"end":{"line":13,"column":16}}})) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"htmlLink") : stack1),{"name":"if","hash":{},"fn":container.program(18, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":14,"column":2},"end":{"line":19,"column":16}}})) != null ? stack1 : "")
    + "\n</h4>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"forumContent") : stack1),{"name":"if","hash":{},"fn":container.program(23, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":22,"column":0},"end":{"line":31,"column":16}}})) != null ? stack1 : "")
    + "\n\n<div class=\"note-authors\">\n  "
    + alias3((lookupProperty(helpers,"noteAuthors")||(depth0 && lookupProperty(depth0,"noteAuthors"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"content") : depth0),(depth0 != null ? lookupProperty(depth0,"signatures") : depth0),(depth0 != null ? lookupProperty(depth0,"details") : depth0),{"name":"noteAuthors","hash":{},"data":data,"loc":{"start":{"line":34,"column":2},"end":{"line":34,"column":44}}}))
    + "\n</div>\n\n<div class=\"note-meta-info\">\n  <span class=\"item date\">"
    + alias3((lookupProperty(helpers,"forumDate")||(depth0 && lookupProperty(depth0,"forumDate"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"cdate") : depth0),(depth0 != null ? lookupProperty(depth0,"tcdate") : depth0),(depth0 != null ? lookupProperty(depth0,"mdate") : depth0),(depth0 != null ? lookupProperty(depth0,"tmdate") : depth0),((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"year") : stack1),(depth0 != null ? lookupProperty(depth0,"pdate") : depth0),{"name":"forumDate","hash":{},"data":data,"loc":{"start":{"line":38,"column":26},"end":{"line":38,"column":84}}}))
    + "</span>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showInvitation") : stack1),{"name":"if","hash":{},"fn":container.program(30, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":39,"column":2},"end":{"line":45,"column":9}}})) != null ? stack1 : "")
    + "  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showReaders") : stack1),{"name":"if","hash":{},"fn":container.program(35, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":46,"column":2},"end":{"line":48,"column":16}}})) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"replyCount") : stack1),{"name":"if","hash":{},"fn":container.program(38, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":49,"column":2},"end":{"line":51,"column":18}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"metadata") : depth0)) != null ? lookupProperty(stack1,"conflict") : stack1),{"name":"if","hash":{},"fn":container.program(41, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":52,"column":2},"end":{"line":54,"column":9}}})) != null ? stack1 : "")
    + "  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showActionButtons") : stack1),{"name":"if","hash":{},"fn":container.program(43, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":55,"column":2},"end":{"line":67,"column":16}}})) != null ? stack1 : "")
    + "\n</div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showContents") : stack1),{"name":"if","hash":{},"fn":container.program(51, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":70,"column":0},"end":{"line":72,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showTags") : stack1),{"name":"if","hash":{},"fn":container.program(53, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":74,"column":0},"end":{"line":76,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showEdges") : stack1),{"name":"if","hash":{},"fn":container.program(55, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":78,"column":0},"end":{"line":80,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showTasks") : stack1),{"name":"if","hash":{},"fn":container.program(57, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":82,"column":0},"end":{"line":89,"column":14}}})) != null ? stack1 : "")
    + "\n";
},"useData":true});
templates['partials/noteBasicV2'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"path") : stack1), depth0));
},"3":function(container,depth0,helpers,partials,data) {
    return "forum";
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&noteId="
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"data":data,"loc":{"start":{"line":3,"column":107},"end":{"line":3,"column":113}}}) : helper)));
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&referrer="
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"referrer") : stack1), depth0));
},"9":function(container,depth0,helpers,partials,data) {
    return "target=\"_blank\"";
},"11":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      "
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"title") : stack1)) != null ? lookupProperty(stack1,"value") : stack1), depth0))
    + "\n";
},"13":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      "
    + container.escapeExpression((lookupProperty(helpers,"noteTitle")||(depth0 && lookupProperty(depth0,"noteTitle"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"invitations") : depth0)) != null ? lookupProperty(stack1,"0") : stack1),(depth0 != null ? lookupProperty(depth0,"signatures") : depth0),{"name":"noteTitle","hash":{},"data":data,"loc":{"start":{"line":7,"column":6},"end":{"line":7,"column":46}}}))
    + "\n";
},"15":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"pdf") : stack1)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"if","hash":{},"fn":container.program(16, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":25},"end":{"line":13,"column":9}}})) != null ? stack1 : "");
},"16":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n    <a href=\""
    + container.escapeExpression((lookupProperty(helpers,"pdfUrl")||(depth0 && lookupProperty(depth0,"pdfUrl"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,false,{"name":"pdfUrl","hash":{},"data":data,"loc":{"start":{"line":12,"column":13},"end":{"line":12,"column":34}}}))
    + "\" class=\"pdf-link\" title=\"Download PDF\" target=\"_blank\"><img src=\"/images/pdf_icon_blue.svg\"></a>\n  ";
},"18":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"html") : stack1)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"if","hash":{},"fn":container.program(19, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":14,"column":26},"end":{"line":16,"column":9}}})) != null ? stack1 : "");
},"19":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n    <a href=\""
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"html") : stack1)) != null ? lookupProperty(stack1,"value") : stack1), depth0))
    + "\" class=\"html-link\" title=\"Open Website\" target=\"_blank\"><img src=\"/images/html_icon_blue.svg\"></a>\n  ";
},"21":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = (lookupProperty(helpers,"isnt")||(depth0 && lookupProperty(depth0,"isnt"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"id") : depth0),(depth0 != null ? lookupProperty(depth0,"forum") : depth0),{"name":"isnt","hash":{},"fn":container.program(22, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":19,"column":28},"end":{"line":28,"column":9}}})) != null ? stack1 : "");
},"22":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n<div class=\"parent-title\">\n  <span class=\"glyphicon glyphicon-share-alt\"></span>\n  <span class=\"title\">\n"
    + ((stack1 = lookupProperty(helpers,"with").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"forumContent") : stack1),{"name":"with","hash":{},"fn":container.program(23, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":23,"column":4},"end":{"line":25,"column":13}}})) != null ? stack1 : "")
    + "  </span>\n</div>\n";
},"23":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"title") : depth0),{"name":"if","hash":{},"fn":container.program(24, data, 0),"inverse":container.program(26, data, 0),"data":data,"loc":{"start":{"line":24,"column":6},"end":{"line":24,"column":51}}})) != null ? stack1 : "")
    + "\n";
},"24":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"data":data,"loc":{"start":{"line":24,"column":19},"end":{"line":24,"column":28}}}) : helper)));
},"26":function(container,depth0,helpers,partials,data) {
    return "No Title";
},"28":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"item\">"
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"venue") : stack1)) != null ? lookupProperty(stack1,"value") : stack1), depth0))
    + "</span>\n";
},"30":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"item\">"
    + container.escapeExpression((lookupProperty(helpers,"prettyId")||(depth0 && lookupProperty(depth0,"prettyId"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"invitations") : depth0)) != null ? lookupProperty(stack1,"0") : stack1),{"name":"prettyId","hash":{},"data":data,"loc":{"start":{"line":39,"column":23},"end":{"line":39,"column":51}}}))
    + "</span>\n";
},"32":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"readers\">Readers: "
    + container.escapeExpression((lookupProperty(helpers,"forumReaders")||(depth0 && lookupProperty(depth0,"forumReaders"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"readers") : depth0),{"name":"forumReaders","hash":{},"data":data,"loc":{"start":{"line":42,"column":35},"end":{"line":42,"column":59}}}))
    + "</span>\n";
},"34":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = (lookupProperty(helpers,"isnt")||(depth0 && lookupProperty(depth0,"isnt"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replyCount") : stack1),undefined,{"name":"isnt","hash":{},"fn":container.program(35, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":44,"column":28},"end":{"line":46,"column":11}}})) != null ? stack1 : "");
},"35":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n    <span>"
    + container.escapeExpression((lookupProperty(helpers,"inflect")||(depth0 && lookupProperty(depth0,"inflect"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replyCount") : stack1),"Reply","Replies",true,{"name":"inflect","hash":{},"data":data,"loc":{"start":{"line":45,"column":10},"end":{"line":45,"column":63}}}))
    + "</span>\n  ";
},"37":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  "
    + container.escapeExpression((lookupProperty(helpers,"noteContentCollapsible")||(depth0 && lookupProperty(depth0,"noteContentCollapsible"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"noteContentCollapsible","hash":{},"data":data,"loc":{"start":{"line":50,"column":2},"end":{"line":50,"column":33}}}))
    + "\n";
},"39":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  "
    + container.escapeExpression((lookupProperty(helpers,"tagWidgets")||(depth0 && lookupProperty(depth0,"tagWidgets"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"tags") : stack1),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"tagInvitations") : stack1),((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"tagInvitations") : stack1),{"name":"tagWidgets","hash":{},"data":data,"loc":{"start":{"line":54,"column":2},"end":{"line":54,"column":75}}}))
    + "\n";
},"41":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  "
    + container.escapeExpression((lookupProperty(helpers,"tagWidgets")||(depth0 && lookupProperty(depth0,"tagWidgets"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"edges") : stack1),((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"edgeInvitations") : stack1),{"name":"tagWidgets","hash":{},"data":data,"loc":{"start":{"line":58,"column":2},"end":{"line":58,"column":54}}}))
    + "\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h4>\n  <a href=\"/"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"path") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":3,"column":12},"end":{"line":3,"column":68}}})) != null ? stack1 : "")
    + "?id="
    + alias3(((helper = (helper = lookupProperty(helpers,"forum") || (depth0 != null ? lookupProperty(depth0,"forum") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"forum","hash":{},"data":data,"loc":{"start":{"line":3,"column":72},"end":{"line":3,"column":81}}}) : helper)))
    + ((stack1 = (lookupProperty(helpers,"isnt")||(depth0 && lookupProperty(depth0,"isnt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"id") : depth0),(depth0 != null ? lookupProperty(depth0,"forum") : depth0),{"name":"isnt","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":81},"end":{"line":3,"column":122}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"referrer") : stack1),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":122},"end":{"line":3,"column":183}}})) != null ? stack1 : "")
    + "\" "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"openInNewTab") : stack1),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":185},"end":{"line":3,"column":235}}})) != null ? stack1 : "")
    + ">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"title") : stack1)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.program(13, data, 0),"data":data,"loc":{"start":{"line":4,"column":4},"end":{"line":8,"column":11}}})) != null ? stack1 : "")
    + "  </a>\n\n  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"pdfLink") : stack1),{"name":"if","hash":{},"fn":container.program(15, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":2},"end":{"line":13,"column":16}}})) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"htmlLink") : stack1),{"name":"if","hash":{},"fn":container.program(18, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":14,"column":2},"end":{"line":16,"column":16}}})) != null ? stack1 : "")
    + "\n</h4>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"forumContent") : stack1),{"name":"if","hash":{},"fn":container.program(21, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":19,"column":0},"end":{"line":28,"column":16}}})) != null ? stack1 : "")
    + "\n\n<div class=\"note-authors\">\n  "
    + alias3((lookupProperty(helpers,"noteAuthorsV2")||(depth0 && lookupProperty(depth0,"noteAuthorsV2"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"readers") : depth0),(depth0 != null ? lookupProperty(depth0,"content") : depth0),(depth0 != null ? lookupProperty(depth0,"signatures") : depth0),{"name":"noteAuthorsV2","hash":{},"data":data,"loc":{"start":{"line":31,"column":2},"end":{"line":31,"column":46}}}))
    + "\n</div>\n\n<div class=\"note-meta-info\">\n  <span class=\"date\">"
    + alias3((lookupProperty(helpers,"forumDate")||(depth0 && lookupProperty(depth0,"forumDate"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"cdate") : depth0),(depth0 != null ? lookupProperty(depth0,"tcdate") : depth0),(depth0 != null ? lookupProperty(depth0,"mdate") : depth0),(depth0 != null ? lookupProperty(depth0,"tmdate") : depth0),((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"year") : stack1)) != null ? lookupProperty(stack1,"value") : stack1),(depth0 != null ? lookupProperty(depth0,"pdate") : depth0),{"name":"forumDate","hash":{},"data":data,"loc":{"start":{"line":35,"column":21},"end":{"line":35,"column":85}}}))
    + "</span>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"venue") : stack1)) != null ? lookupProperty(stack1,"value") : stack1),{"name":"if","hash":{},"fn":container.program(28, data, 0),"inverse":container.program(30, data, 0),"data":data,"loc":{"start":{"line":36,"column":2},"end":{"line":40,"column":9}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"readers") : depth0),{"name":"if","hash":{},"fn":container.program(32, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":41,"column":2},"end":{"line":43,"column":9}}})) != null ? stack1 : "")
    + "  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"replyCount") : stack1),{"name":"if","hash":{},"fn":container.program(34, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":44,"column":2},"end":{"line":46,"column":18}}})) != null ? stack1 : "")
    + "\n</div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showContents") : stack1),{"name":"if","hash":{},"fn":container.program(37, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":49,"column":0},"end":{"line":51,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showTags") : stack1),{"name":"if","hash":{},"fn":container.program(39, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":53,"column":0},"end":{"line":55,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showEdges") : stack1),{"name":"if","hash":{},"fn":container.program(41, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":57,"column":0},"end":{"line":59,"column":7}}})) != null ? stack1 : "")
    + "\n";
},"useData":true});
templates['partials/noteContent'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <li>\n      <strong class=\"note-content-field\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"customFieldName") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":5,"column":8},"end":{"line":9,"column":15}}})) != null ? stack1 : "")
    + "      </strong>\n      <span class=\"note-content-value "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"markdownRendered") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":38},"end":{"line":11,"column":86}}})) != null ? stack1 : "")
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"fieldValue") || (depth0 != null ? lookupProperty(depth0,"fieldValue") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"fieldValue","hash":{},"data":data,"loc":{"start":{"line":11,"column":88},"end":{"line":11,"column":102}}}) : helper)))
    + "</span>\n    </li>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"customFieldName") || (depth0 != null ? lookupProperty(depth0,"customFieldName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"customFieldName","hash":{},"data":data,"loc":{"start":{"line":6,"column":10},"end":{"line":6,"column":29}}}) : helper)))
    + ":\n";
},"4":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          "
    + container.escapeExpression((lookupProperty(helpers,"prettyField")||(depth0 && lookupProperty(depth0,"prettyField"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"fieldName") : depth0),{"name":"prettyField","hash":{},"data":data,"loc":{"start":{"line":8,"column":10},"end":{"line":8,"column":35}}}))
    + ":\n";
},"6":function(container,depth0,helpers,partials,data) {
    return "markdown-rendered";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"list-unstyled note-content\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":2},"end":{"line":13,"column":11}}})) != null ? stack1 : "")
    + "</ul>\n";
},"useData":true});
templates['partials/noteList'] = template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <li class=\"note "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"metadata") : depth0)) != null ? lookupProperty(stack1,"conflict") : stack1),{"name":"if","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":20},"end":{"line":3,"column":64}}})) != null ? stack1 : "")
    + "\" data-id=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":3,"column":75},"end":{"line":3,"column":81}}}) : helper)))
    + "\" data-number=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"number") || (depth0 != null ? lookupProperty(depth0,"number") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"number","hash":{},"data":data,"loc":{"start":{"line":3,"column":96},"end":{"line":3,"column":106}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"isEqual")||(depth0 && lookupProperty(depth0,"isEqual"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"version") : depth0),2,{"name":"isEqual","hash":{},"data":data,"loc":{"start":{"line":4,"column":12},"end":{"line":4,"column":31}}}),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.program(6, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":4,"column":6},"end":{"line":8,"column":13}}})) != null ? stack1 : "")
    + "    </li>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "has-conflict";
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"noteBasicV2"),depth0,{"name":"noteBasicV2","hash":{"options":(depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])},"data":data,"indent":"        ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"6":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"noteBasic"),depth0,{"name":"noteBasic","hash":{"options":(depths[1] != null ? lookupProperty(depths[1],"options") : depths[1])},"data":data,"indent":"        ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <li><p class=\"empty-message\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"emptyMessage") : stack1), depth0))
    + "</p></li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"list-unstyled submissions-list\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"notes") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.program(8, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":2,"column":2},"end":{"line":12,"column":11}}})) != null ? stack1 : "")
    + "</ul>\n";
},"usePartial":true,"useData":true,"useDepths":true});
templates['partials/noteTask'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"reply") : depth0)) != null ? lookupProperty(stack1,"replyto") : stack1),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":4,"column":4},"end":{"line":8,"column":11}}})) != null ? stack1 : "")
    + "    <span class=\"duedate "
    + alias4(((helper = (helper = lookupProperty(helpers,"dueDateStatus") || (depth0 != null ? lookupProperty(depth0,"dueDateStatus") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"dueDateStatus","hash":{},"data":data,"loc":{"start":{"line":9,"column":25},"end":{"line":9,"column":42}}}) : helper)))
    + "\">Due: "
    + alias4(((helper = (helper = lookupProperty(helpers,"dueDateStr") || (depth0 != null ? lookupProperty(depth0,"dueDateStr") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"dueDateStr","hash":{},"data":data,"loc":{"start":{"line":9,"column":49},"end":{"line":9,"column":63}}}) : helper)))
    + "</span>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), alias4=container.hooks.helperMissing, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <a href=\"/forum?id="
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replytoNote") : stack1)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + "&noteId="
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"reply") : depth0)) != null ? lookupProperty(stack1,"replyto") : stack1), depth0))
    + "&invitationId="
    + alias2(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias4),(typeof helper === "function" ? helper.call(alias3,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":5,"column":93},"end":{"line":5,"column":99}}}) : helper)))
    + "\">"
    + alias2((lookupProperty(helpers,"prettyInvitationId")||(depth0 && lookupProperty(depth0,"prettyInvitationId"))||alias4).call(alias3,(depth0 != null ? lookupProperty(depth0,"id") : depth0),{"name":"prettyInvitationId","hash":{},"data":data,"loc":{"start":{"line":5,"column":101},"end":{"line":5,"column":126}}}))
    + "</a>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=container.escapeExpression, alias2=depth0 != null ? depth0 : (container.nullContext || {}), alias3=container.hooks.helperMissing, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <a href=\"/forum?id="
    + alias1(container.lambda(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replytoNote") : stack1)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + "&invitationId="
    + alias1(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias3),(typeof helper === "function" ? helper.call(alias2,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":7,"column":68},"end":{"line":7,"column":74}}}) : helper)))
    + "\">"
    + alias1((lookupProperty(helpers,"prettyInvitationId")||(depth0 && lookupProperty(depth0,"prettyInvitationId"))||alias3).call(alias2,(depth0 != null ? lookupProperty(depth0,"id") : depth0),{"name":"prettyInvitationId","hash":{},"data":data,"loc":{"start":{"line":7,"column":76},"end":{"line":7,"column":101}}}))
    + "</a>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <a href=\"/forum?id="
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replytoNote") : stack1)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + "&noteId="
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"repliedNotes") : stack1)) != null ? lookupProperty(stack1,"0") : stack1)) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\">"
    + alias2((lookupProperty(helpers,"prettyInvitationId")||(depth0 && lookupProperty(depth0,"prettyInvitationId"))||container.hooks.helperMissing).call(alias3,(depth0 != null ? lookupProperty(depth0,"id") : depth0),{"name":"prettyInvitationId","hash":{},"data":data,"loc":{"start":{"line":11,"column":91},"end":{"line":11,"column":116}}}))
    + ": "
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"repliedNotes") : stack1)) != null ? lookupProperty(stack1,"0") : stack1)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "</a>\n"
    + ((stack1 = lookupProperty(helpers,"with").call(alias3,((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"repliedNotes") : stack1)) != null ? lookupProperty(stack1,"0") : stack1),{"name":"with","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":12,"column":4},"end":{"line":14,"column":13}}})) != null ? stack1 : "");
},"7":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"completed-date\">Completed: "
    + container.escapeExpression((lookupProperty(helpers,"forumDate")||(depth0 && lookupProperty(depth0,"forumDate"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"cdate") : depth0),(depth0 != null ? lookupProperty(depth0,"tcdate") : depth0),(depth0 != null ? lookupProperty(depth0,"mdate") : depth0),(depth0 != null ? lookupProperty(depth0,"tmdate") : depth0),null,{"name":"forumDate","hash":{},"data":data,"loc":{"start":{"line":13,"column":44},"end":{"line":13,"column":88}}}))
    + "</span>\n";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"parent-title\">\n  <span class=\"glyphicon glyphicon-share-alt\"></span>\n  <span class=\"title\"><a href=\"/forum?id="
    + alias3(((helper = (helper = lookupProperty(helpers,"forum") || (depth0 != null ? lookupProperty(depth0,"forum") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"forum","hash":{},"data":data,"loc":{"start":{"line":21,"column":41},"end":{"line":21,"column":50}}}) : helper)))
    + "\">"
    + alias3(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"content") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "</a></span>\n</div>\n\n<div class=\"note-authors\">\n  "
    + alias3((lookupProperty(helpers,"noteAuthors")||(depth0 && lookupProperty(depth0,"noteAuthors"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"content") : depth0),(depth0 != null ? lookupProperty(depth0,"signatures") : depth0),(depth0 != null ? lookupProperty(depth0,"details") : depth0),{"name":"noteAuthors","hash":{},"data":data,"loc":{"start":{"line":25,"column":2},"end":{"line":25,"column":44}}}))
    + "\n</div>\n";
},"11":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  "
    + container.escapeExpression((lookupProperty(helpers,"noteContentCollapsible")||(depth0 && lookupProperty(depth0,"noteContentCollapsible"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replytoNote") : stack1),{"name":"noteContentCollapsible","hash":{"invitation":depth0},"data":data,"loc":{"start":{"line":30,"column":2},"end":{"line":30,"column":64}}}))
    + "\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h4>\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"completed") : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(6, data, 0),"data":data,"loc":{"start":{"line":3,"column":2},"end":{"line":15,"column":13}}})) != null ? stack1 : "")
    + "</h4>\n\n"
    + ((stack1 = lookupProperty(helpers,"with").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replytoNote") : stack1),{"name":"with","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":0},"end":{"line":27,"column":9}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showContents") : stack1),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":29,"column":0},"end":{"line":31,"column":7}}})) != null ? stack1 : "");
},"useData":true});
templates['partials/paginationLinks'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "loading";
},"3":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <li class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"disabled") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":4,"column":17},"end":{"line":4,"column":48}}})) != null ? stack1 : "")
    + " "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"active") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":4,"column":49},"end":{"line":4,"column":76}}})) != null ? stack1 : "")
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"extraClasses") || (depth0 != null ? lookupProperty(depth0,"extraClasses") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"extraClasses","hash":{},"data":data,"loc":{"start":{"line":4,"column":77},"end":{"line":4,"column":93}}}) : helper)))
    + "\" data-page-number=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"number") || (depth0 != null ? lookupProperty(depth0,"number") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"number","hash":{},"data":data,"loc":{"start":{"line":4,"column":113},"end":{"line":4,"column":123}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"disabled") : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0, blockParams, depths),"inverse":container.program(10, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":5,"column":8},"end":{"line":9,"column":15}}})) != null ? stack1 : "")
    + "      </li>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return "disabled";
},"6":function(container,depth0,helpers,partials,data) {
    return "active";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <span>"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"label") || (depth0 != null ? lookupProperty(depth0,"label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"label","hash":{},"data":data,"loc":{"start":{"line":6,"column":16},"end":{"line":6,"column":27}}}) : helper))) != null ? stack1 : "")
    + "</span>\n";
},"10":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <a href=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depths[1] != null ? lookupProperty(depths[1],"baseUrl") : depths[1]),{"name":"if","hash":{},"fn":container.program(11, data, 0, blockParams, depths),"inverse":container.program(13, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":8,"column":19},"end":{"line":8,"column":83}}})) != null ? stack1 : "")
    + "\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"label") || (depth0 != null ? lookupProperty(depth0,"label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"label","hash":{},"data":data,"loc":{"start":{"line":8,"column":85},"end":{"line":8,"column":96}}}) : helper))) != null ? stack1 : "")
    + "</a>\n";
},"11":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var helper, alias1=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return alias1(container.lambda((depths[1] != null ? lookupProperty(depths[1],"baseUrl") : depths[1]), depth0))
    + "&page="
    + alias1(((helper = (helper = lookupProperty(helpers,"number") || (depth0 != null ? lookupProperty(depth0,"number") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"number","hash":{},"data":data,"loc":{"start":{"line":8,"column":57},"end":{"line":8,"column":67}}}) : helper)));
},"13":function(container,depth0,helpers,partials,data) {
    return "#";
},"15":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"pagination-count\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"countText") || (depth0 != null ? lookupProperty(depth0,"countText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"countText","hash":{},"data":data,"loc":{"start":{"line":14,"column":35},"end":{"line":14,"column":48}}}) : helper)))
    + "</span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<nav class=\"pagination-container text-center "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"loading") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":1,"column":45},"end":{"line":1,"column":82}}})) != null ? stack1 : "")
    + "\" aria-label=\"page navigation\">\n  <ul class=\"pagination\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"pageList") : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":4},"end":{"line":11,"column":13}}})) != null ? stack1 : "")
    + "  </ul>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"options") : depth0)) != null ? lookupProperty(stack1,"showCount") : stack1),{"name":"if","hash":{},"fn":container.program(15, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":13,"column":2},"end":{"line":15,"column":9}}})) != null ? stack1 : "")
    + "</nav>\n";
},"useData":true,"useDepths":true});
templates['partials/taskList'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "style=\"display: none;\"";
},"3":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <li class=\"note "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"completed") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":20},"end":{"line":3,"column":53}}})) != null ? stack1 : "")
    + "\" data-id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":3,"column":64},"end":{"line":3,"column":70}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"tagInvitation") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":4,"column":6},"end":{"line":13,"column":13}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"noteInvitation") : depth0),{"name":"if","hash":{},"fn":container.program(12, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":15,"column":6},"end":{"line":50,"column":13}}})) != null ? stack1 : "")
    + "    </li>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return "completed";
},"6":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <h4>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"web") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0, blockParams, depths),"inverse":container.program(10, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":6,"column":10},"end":{"line":10,"column":17}}})) != null ? stack1 : "")
    + "          <span class=\"duedate "
    + alias4(((helper = (helper = lookupProperty(helpers,"dueDateStatus") || (depth0 != null ? lookupProperty(depth0,"dueDateStatus") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"dueDateStatus","hash":{},"data":data,"loc":{"start":{"line":11,"column":31},"end":{"line":11,"column":48}}}) : helper)))
    + "\">Due: "
    + alias4(((helper = (helper = lookupProperty(helpers,"dueDateStr") || (depth0 != null ? lookupProperty(depth0,"dueDateStr") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"dueDateStr","hash":{},"data":data,"loc":{"start":{"line":11,"column":55},"end":{"line":11,"column":69}}}) : helper)))
    + "</span>\n        </h4>\n";
},"7":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <a href=\"/invitation?id="
    + alias3(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":7,"column":34},"end":{"line":7,"column":40}}}) : helper)))
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"taskOptions") : depths[1])) != null ? lookupProperty(stack1,"referrer") : stack1),{"name":"if","hash":{},"fn":container.program(8, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":7,"column":40},"end":{"line":7,"column":115}}})) != null ? stack1 : "")
    + "\">"
    + alias3((lookupProperty(helpers,"prettyInvitationId")||(depth0 && lookupProperty(depth0,"prettyInvitationId"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"id") : depth0),{"name":"prettyInvitationId","hash":{"includePaperNum":true},"data":data,"loc":{"start":{"line":7,"column":117},"end":{"line":7,"column":163}}}))
    + "</a>\n";
},"8":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&referrer="
    + container.escapeExpression(container.lambda(((stack1 = (depths[1] != null ? lookupProperty(depths[1],"taskOptions") : depths[1])) != null ? lookupProperty(stack1,"referrer") : stack1), depth0));
},"10":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <a href=\"/group?id="
    + alias3(((helper = (helper = lookupProperty(helpers,"groupId") || (depth0 != null ? lookupProperty(depth0,"groupId") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"groupId","hash":{},"data":data,"loc":{"start":{"line":9,"column":29},"end":{"line":9,"column":40}}}) : helper)))
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"taskOptions") : depths[1])) != null ? lookupProperty(stack1,"referrer") : stack1),{"name":"if","hash":{},"fn":container.program(8, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":9,"column":40},"end":{"line":9,"column":115}}})) != null ? stack1 : "")
    + "\">"
    + alias3((lookupProperty(helpers,"prettyInvitationId")||(depth0 && lookupProperty(depth0,"prettyInvitationId"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"id") : depth0),{"name":"prettyInvitationId","hash":{"includePaperNum":true},"data":data,"loc":{"start":{"line":9,"column":117},"end":{"line":9,"column":163}}}))
    + "</a>\n";
},"12":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <h4>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"taskOptions") : depths[1])) != null ? lookupProperty(stack1,"apiV2") : stack1),{"name":"if","hash":{},"fn":container.program(13, data, 0, blockParams, depths),"inverse":container.program(19, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":17,"column":10},"end":{"line":37,"column":17}}})) != null ? stack1 : "")
    + "          <span class=\"duedate "
    + alias4(((helper = (helper = lookupProperty(helpers,"dueDateStatus") || (depth0 != null ? lookupProperty(depth0,"dueDateStatus") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"dueDateStatus","hash":{},"data":data,"loc":{"start":{"line":38,"column":31},"end":{"line":38,"column":48}}}) : helper)))
    + "\">Due: "
    + alias4(((helper = (helper = lookupProperty(helpers,"dueDateStr") || (depth0 != null ? lookupProperty(depth0,"dueDateStr") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"dueDateStr","hash":{},"data":data,"loc":{"start":{"line":38,"column":55},"end":{"line":38,"column":69}}}) : helper)))
    + "</span>\n        </h4>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replytoNote") : stack1)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"title") : stack1),{"name":"if","hash":{},"fn":container.program(21, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":40,"column":8},"end":{"line":49,"column":15}}})) != null ? stack1 : "");
},"13":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"edit") : depth0)) != null ? lookupProperty(stack1,"note") : stack1)) != null ? lookupProperty(stack1,"replyto") : stack1),{"name":"if","hash":{},"fn":container.program(14, data, 0, blockParams, depths),"inverse":container.program(17, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":18,"column":12},"end":{"line":26,"column":19}}})) != null ? stack1 : "");
},"14":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=container.escapeExpression, alias2=depth0 != null ? depth0 : (container.nullContext || {}), alias3=container.hooks.helperMissing, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              <a href=\"/forum?id="
    + alias1(container.lambda(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replytoNote") : stack1)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + "&noteId="
    + alias1(((helper = (helper = lookupProperty(helpers,"noteId") || (depth0 != null ? lookupProperty(depth0,"noteId") : depth0)) != null ? helper : alias3),(typeof helper === "function" ? helper.call(alias2,{"name":"noteId","hash":{},"data":data,"loc":{"start":{"line":19,"column":70},"end":{"line":19,"column":80}}}) : helper)))
    + ((stack1 = lookupProperty(helpers,"unless").call(alias2,(depth0 != null ? lookupProperty(depth0,"completed") : depth0),{"name":"unless","hash":{},"fn":container.program(15, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":19,"column":80},"end":{"line":19,"column":132}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias2,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"taskOptions") : depths[1])) != null ? lookupProperty(stack1,"referrer") : stack1),{"name":"if","hash":{},"fn":container.program(8, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":19,"column":132},"end":{"line":19,"column":207}}})) != null ? stack1 : "")
    + "\">\n                "
    + alias1((lookupProperty(helpers,"prettyInvitationId")||(depth0 && lookupProperty(depth0,"prettyInvitationId"))||alias3).call(alias2,(depth0 != null ? lookupProperty(depth0,"id") : depth0),{"name":"prettyInvitationId","hash":{"includePaperNum":true},"data":data,"loc":{"start":{"line":20,"column":16},"end":{"line":20,"column":62}}}))
    + "\n              </a>\n";
},"15":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "&invitationId="
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"data":data,"loc":{"start":{"line":19,"column":115},"end":{"line":19,"column":121}}}) : helper)));
},"17":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=container.escapeExpression, alias2=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              <a href=\"/forum?id="
    + alias1(container.lambda(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replytoNote") : stack1)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + ((stack1 = lookupProperty(helpers,"unless").call(alias2,(depth0 != null ? lookupProperty(depth0,"completed") : depth0),{"name":"unless","hash":{},"fn":container.program(15, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":23,"column":62},"end":{"line":23,"column":114}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias2,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"taskOptions") : depths[1])) != null ? lookupProperty(stack1,"referrer") : stack1),{"name":"if","hash":{},"fn":container.program(8, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":23,"column":114},"end":{"line":23,"column":189}}})) != null ? stack1 : "")
    + "\">\n                "
    + alias1((lookupProperty(helpers,"prettyInvitationId")||(depth0 && lookupProperty(depth0,"prettyInvitationId"))||container.hooks.helperMissing).call(alias2,(depth0 != null ? lookupProperty(depth0,"id") : depth0),{"name":"prettyInvitationId","hash":{"includePaperNum":true},"data":data,"loc":{"start":{"line":24,"column":16},"end":{"line":24,"column":62}}}))
    + "\n              </a>\n";
},"19":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"reply") : depth0)) != null ? lookupProperty(stack1,"replyto") : stack1),{"name":"if","hash":{},"fn":container.program(14, data, 0, blockParams, depths),"inverse":container.program(17, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":28,"column":12},"end":{"line":36,"column":19}}})) != null ? stack1 : "");
},"21":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <div class=\"parent-title\">\n            <span class=\"glyphicon glyphicon-share-alt\"></span>\n            <span class=\"title\">\n              <a href=\"/forum?id="
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replytoNote") : stack1)) != null ? lookupProperty(stack1,"forum") : stack1), depth0))
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"taskOptions") : depths[1])) != null ? lookupProperty(stack1,"referrer") : stack1),{"name":"if","hash":{},"fn":container.program(8, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":44,"column":62},"end":{"line":44,"column":137}}})) != null ? stack1 : "")
    + "\">\n                "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depths[1] != null ? lookupProperty(depths[1],"taskOptions") : depths[1])) != null ? lookupProperty(stack1,"apiV2") : stack1),{"name":"if","hash":{},"fn":container.program(22, data, 0, blockParams, depths),"inverse":container.program(24, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":45,"column":16},"end":{"line":45,"column":139}}})) != null ? stack1 : "")
    + "\n              </a>\n            </span>\n          </div>\n";
},"22":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(container.lambda(((stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replytoNote") : stack1)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"title") : stack1)) != null ? lookupProperty(stack1,"value") : stack1), depth0));
},"24":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(container.lambda(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? lookupProperty(depth0,"details") : depth0)) != null ? lookupProperty(stack1,"replytoNote") : stack1)) != null ? lookupProperty(stack1,"content") : stack1)) != null ? lookupProperty(stack1,"title") : stack1), depth0));
},"26":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <li><p class=\"empty-message\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"taskOptions") : depth0)) != null ? lookupProperty(stack1,"emptyMessage") : stack1), depth0))
    + "</p></li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"list-unstyled submissions-list task-list\" "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"taskOptions") : depth0)) != null ? lookupProperty(stack1,"collapsed") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":1,"column":53},"end":{"line":1,"column":111}}})) != null ? stack1 : "")
    + ">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"invitations") : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.program(26, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":2,"column":2},"end":{"line":54,"column":11}}})) != null ? stack1 : "")
    + "</ul>\n";
},"useData":true,"useDepths":true});
})();