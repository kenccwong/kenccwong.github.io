;(function($, window, undefined) {
  'use strict';
  console.log('script.js 30Jan2018');
  var pluginName = 'add-field';
  var events = {
    click: 'click.'+ pluginName
  };

  function AddField(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  AddField.prototype = {
    init: function() {
      var that = this,
          opts = that.options;
      that.initDom();
      that.btnAddField
      .off(events.click)
      .on(events.click,function(e){
        e.preventDefault();
        if(that.elem.siblings().length < opts.maxItem) {
          that.elem.parent().append(that.cloneTemplate.clone());
        }
      });
      that.elem.parent()
      .off(events.click,  that.classRemoveField)
      .on(events.click, that.classRemoveField, function(e){
        e.preventDefault();
        var $self = $(this);
        $self.parent().remove();
      });
    },
    initDom: function () {
      var opts = this.options;
      this.elem = this.element;
      this.btnAddField = $('.'+opts.classAddField, this.elem);
      this.classRemoveField = '.'+opts.classRemoveField;
      this.cloneTemplate = this.elem.clone();
      $('label', this.cloneTemplate).hide();
      $('.'+opts.classAddField, this.cloneTemplate)
      .removeClass(opts.classAddField)
      .addClass(opts.classRemoveField)
      .html('X');
    },

    destroy: function() {
      // remove events
      // deinitialize
      $.removeData(this.element[0], pluginName);
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new AddField(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {
    maxItem: 10,
    classAddField: 'btn-add-field',
    classRemoveField: 'btn-remove-field'
  };

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });

}(jQuery, window));

;(function($, window, undefined) {
  'use strict';

  var pluginName = 'add-services';
  var initForm = false,
      path = Site.vars.assetPath;
      // resendOTP = true,
      // resetCountingOTP;

  var events = {
    click: 'click.' + pluginName,
    change: 'change.' + pluginName,
    keyup: 'keyup.' + pluginName,
    beforeunload: 'beforeunload'
  };

  var createPopup = function(popupObj) {
    var button = popupObj.confirm ? '<button class="btn btn-default ' + popupObj.confirm.class + ' margin-left-xxs" type="button" data-toggle="modal" data-dismiss="modal" data-id="' + popupObj.confirm.id + '">' + popupObj.confirm.title + '</button>' : '',
      popup = Site.vars.bodyElem.find('[data-id=common-popup]');
      popup.html('<div class="modal-dialog partial-screen-modal-dialog"><div class="modal-content overflow-auto"><div class="modal-header bg-t2"><button class="modal-header-btn pull-left" data-dismiss="modal"><svg class="icon-xs hide-on-fallback" role="img" title="closewhite-glyph"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#closewhite-glyph"></use><image class="icon-fallback" alt="closewhite-glyph" src="'+ path +'closewhite-glyph.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image></svg>  </button><h6 class="w text-center">' + popupObj.title + '</h6></div><div class="modal-container padding-top-xxl content-centering"><p class="content-centering bt2">' + popupObj.description + '</p><div class="margin-bottom-l margin-top-xxl"><button class="btn btn-default ' + popupObj.decline.class + '" type="button" data-dismiss="modal" data-id="' + popupObj.decline.id + '">' + popupObj.decline.title + '</button>' + button + '</div></div></div></div>');
      popup.off('hidden.bs.modal').on('hidden.bs.modal', popupObj.decline.func);
      popupObj.confirm && Site.vars.bodyElem.off(events.click, '[data-id=' + popupObj.confirm.id + ']').on(events.click, '[data-id=' + popupObj.confirm.id + ']', popupObj.confirm.func);
      popup.modal('show');
  };

  var listFile = function(fileRef, url, fileName) {
    return '<a class="lk2" data-file-ref="' + fileRef + '" data-id="uploaded-file" href="'+ url +'" target="_blank">' + fileName + '</a>' +
      '<button class="remove-button" type="button" aria-label="Remove" data-id="remove-file"> ' +
        '<span aria-hidden="true">×</span>' +
      '</button>';
  };
  var popupError = function() {
    Site.vars.winElem.unbind(events.beforeunload);
    setTimeout(function() {
      createPopup({
        title: 'WARNING',
        description: 'Please try to Save the document again.',
        decline: {
          id: 'close',
          title: 'Close',
          class: 'btn-secondary',
          func: function() {}
        }
      });
    }, 350);
  };

  function AddServices(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  AddServices.prototype = {
    init: function() {
      var that = this;
      window.endPointApi = that.element.data('end-point-api');
      that.statusTitle = {
        editAdd: 'proceed',
        editCompleted: 'Edit More',
        editIncomplete:'Edit To Complete',
        statusCompleted: 'Form Completed',
        statusIncomplete: 'Incomplete',
        statusAdd: 'Added',
        remove: 'remove',
        draft: 'draft',
        completed: 'completed',
        inProgress: 'In-Progress'
      };

      that.initDom();

      that.posSubmitRef = this.element.data('submit-ref');
      that.currentStep = 1;
      that.maxSelect = 10;
      that.countSelectSR = 0;
      that.exceptList = ['SR080','SR077','SR021'];

      that.arrayServicesTemp = [];
      that.arrayServices = [];
      that.isCreatingSR = false;
      that.trigger = {
        cka: {
          loadForm: false
        },
        srCodeEdd: 'SR021',
        srCodeFatca: 'SR077',
        srCodeCrs: 'SR080',
      };
      that.authorType = {
        signature: 'Signature',
        aia2fa: 'AIA2FA',
        onekeySMS: 'OneKeySMS',
        onekeyToken: 'OneKeyToken'
      };
      that.paramsSubmit = {};
      that.otpInfo = {};
      that.isTokenLinked =  false;

      that.witnessData = {};

      that.submitionStatus = false;
      that.targetOrgin = window.location.origin;

      Site.vars.winElem
      .off(events.beforeunload)
      .on(events.beforeunload, function() {

        return true;
      });

      $('[data-id=save-draft]')
      .off(events.click)
      .on(events.click , function (e) {
        e.preventDefault();
        var href = $(this).attr('href');
        that.saveAsDraftAction(function() {
          Site.vars.winElem.unbind(events.beforeunload);
          if(that.currentStep > 5) {
            window.location.replace(href);
            return false;
          }
          createPopup({
            title: 'MESSAGE',
            description: 'Saved as Draft. Your draft will be saved for 30 days and remains editable for 30 days.',
            decline: {
              id: 'close',
              title: 'Close',
              class: 'btn-secondary',
              func: function() {
                window.location.replace(href);
              }
            }
          });
        });
      });

      that.modalSignatureVerified.off('hidden.bs.modal')
      .on('hidden.bs.modal', function (e) {
        e.preventDefault();

        if(that.submitionStatus === false) {
          that.submitionFinal(that.paramsSubmit);
        }
      });

      that.initMethod();
      Site.checkPermission('srp_save_as_draft', function() {
        that.element.find('[data-id=submit-services]').remove();
        that.btnCancelRequest.remove();
        that.btnSaveAsDraft.remove();
        that.saveAsDraftAction = function() {
          return;
        };
        Site.vars.winElem.unbind(events.beforeunload);
      });
    },

    initDom: function() {
      this.leftServiceRequest = this.element.find('[data-id=left-service-request]');
      this.selectItem = this.leftServiceRequest.find('[data-id=list-select-request]');
      this.customerInfo = this.leftServiceRequest.find('[data-id=customer-info]');
      this.rightServiceRequest = this.element.find('[data-id=right-service-request]');
      this.warpStep = this.rightServiceRequest.find('[data-id=content-request]');

      this.step1 = this.warpStep.find('[data-step=1]');
      this.filterSearch = this.step1.find('[data-id=filter-form]');
      this.selectSearch = this.step1.find('[data-id=frequent-field-dropdown]');
      this.inputSearch = this.step1.find('input[type=text]');
      this.ListContainer = this.step1.find('[data-id=request-content] ul');
      this.btnShowMoreStep1 = this.step1.find('[data-id=show-more]');
      this.formRequest = this.step1.find('[data-id=form-request]');
      this.listRequest =  this.step1.find('[data-id=list-request]');

      this.loadingAllPage = $('.loading');

      this.step2 = this.warpStep.find('[data-step=2]');
      this.step3 = this.warpStep.find('[data-step=3]');
      this.step4 = this.warpStep.find('[data-step=4]');
      this.step5 = this.warpStep.find('[data-step=5]');
      this.step6 = this.warpStep.find('[data-step=6]');
      //modal step 5
      this.modalSignatureVerified = $('#addon-modal-signature-verified'),
      this.modalSignatureCancel = $('#addon-modal-signature-cancel'),
      this.modalSMSVerified = $('#addon-modal-sms-verified'),
      this.modalError = $('#addon-modal-proccess-error'),
      this.modalOnkey = $('#addon-modal-onekey'),
      this.hardwareOnekey = $('#addon-modal-onekey-pin'),
      this.smsOnekey = $('#addon-modal-onekey-sms'),
      this.modalOnkeyVerified = $('#addon-modal-onekey-verified'),
      this.smsOnekeyLink = $('#addon-modal-onekey-sms-link'),
      this.hardwareOnekeyLink = $('#addon-modal-onekey-pin-link'),
      this.modalOnkeyNoActDevice = $('#addon-modal-onekey-not-device'),
      this.modalOnkeyAgreeLinkDevice = $('#addon-modal-onekey-agree-link-device'),
      this.modalaiaOTP = $('#addon-modal-aia-sms'),
      this.modalRemote = $('#addon-modal-remote'),
      this.modalResendPdf  = $('#addon-modal-resend-pdf'),
      this.modalRemoteComplete = $('#addon-modal-remote-complited'),
      this.modalSendPdfComplete =$('#addon-modal-send-pdf-complited'),
      this.closeModal = $('[data-id="close"]');

      this.loading = this.rightServiceRequest.find('[data-id=loading-processing-bar]');
      this.loadingPage = this.rightServiceRequest.siblings('[data-id=loading-processing-bar]');
      this.btnSaveAsDraft = this.element.find('[data-id=save-and-draft]');
      this.btnCancelRequest = this.element.find('[data-id=cancel-request]');
      this.template = {
        customerInfo:
                    '{{#if posPolicyNumber}}'+
                      '<p class="h5 margin-bottom-s customer-title">{{LabelPolicyId}}</p>'+
                        '<div class="thumbnail margin-bottom-l">' +
                          '<svg class="icon-m hide-on-fallback" role="img" title="mypolicy-prime1">'+
                            '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#mypolicy-prime1"></use>'+
                            '<image class="icon-fallback" src="'+ path +'icons/mypolicy-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                          '</svg>'+
                      '<div class="thumbnail-text">'+
                        '<h5 class="title-text">{{posPolicyNumber}}</h5>'+
                        '<p class="bt4">{{policyResponse.planName}}</p>'+
                      '</div>' +
                      '</div>' +
                        '<p class="h5 margin-bottom-s customer-title">{{LabelPolicyOwner}}</p>'+
                        '<div class="thumbnail">' +
                        '{{#ifEquals policyHolderGender "M"}}'+
                          '<svg class="icon-m hide-on-fallback" role="img" title="malepressed-prime1">'+
                            '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#malepressed-prime1"></use>'+
                            '<image class="icon-fallback" src="'+ path +'icons/malepressed-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                          '</svg>'+
                          '{{else}}'+
                          '<svg class="icon-m hide-on-fallback" role="img" title="icon-life-primary">'+
                            '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#femalepress-prime1"></use>'+
                            '<image class="icon-fallback" src="'+ path +'icons/femalepress-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                          '</svg>'+
                          '{{/ifEquals}}'+
                      '<div class="thumbnail-text">'+
                        '<h5 class="title-text">{{policyHolderName}}</h5>'+
                        '<p class="bt4">{{policyHolderID}}</p>'+
                      '</div>' +
                    '</div>' +
                      '{{else}}'+
                      '<p class="h5 margin-bottom-s customer-title">{{Labelcustomer}}</p>'+
                        '<div class="thumbnail">' +
                        '{{#ifEquals policyHolderGender "M"}}'+
                          '<svg class="icon-m hide-on-fallback" role="img" title="malepressed-prime1">'+
                            '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#malepressed-prime1"></use>'+
                            '<image class="icon-fallback" src="'+ path +'icons/malepressed-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                          '</svg>'+
                          '{{else}}'+
                          '<svg class="icon-m hide-on-fallback" role="img" title="icon-life-primary">'+
                            '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#femalepress-prime1"></use>'+
                            '<image class="icon-fallback" src="'+ path +'icons/femalepress-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                          '</svg>'+
                          '{{/ifEquals}}'+
                      '<div class="thumbnail-text">'+
                        '<h5 class="title-text">{{policyHolderName}}</h5>'+
                        '<p class="bt4">{{policyHolderID}}</p>'+
                      '</div>' +
                    '</div>' +
                    '{{/if}}',
        selectItem:
            '{{#each .}}'+
              '<div data-sr-code="{{srCode}}" data-submit-ref="{{submitSRRef}}" class="select-item padding-top-xxs padding-bottom-xxs margin-bottom-xs"'+
              '{{#ifNotEquals srCode "sr077"}} {{#ifEquals FATCAInd "Y"}} data-fatca="{{FATCAInd}}" {{/ifEquals}} {{/ifNotEquals}}'+
              '{{#ifNotEquals srCode "sr080"}} {{#ifEquals CRSInd "Y"}} data-crs="{{CRSInd}}"{{/ifEquals}} {{/ifNotEquals}}'+
              '{{#ifNotEquals srCode "sr021"}} {{#ifEquals EDDInd "Y"}} data-edd="{{EDDInd}}" {{/ifEquals}} {{/ifNotEquals}}'+
              '{{#ifEquals CKAInd "Y"}} data-cka="{{CKAInd}}" {{/ifEquals}}'+
              'data-parent-submit="{{parentSRSubmitRef}}"' +
              '{{#each listparentSRSubmitRef}}'+
                ' data-parent-sr-submit-ref-{{ this }}=""'+
              '{{/each}}'+
              ' data-parent-sr-submit-ref-count="{{listparentSRSubmitRef.length}}"'+
              '>' +
                '<div class="select-top">' +
                  '<div class="thumbnail progress-thumbnail margin-bottom-xxs">' +
                '{{#ifEquals submitStatus "draft" }}'+
                  '{{#if ckaData}}' +
                    '<div class="progress-ring">' +
                      '<svg class="icon-m icon-64 hide-on-fallback" role="img" title="{{iconRing}}">' +
                      '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#{{iconRing}}"></use>' +
                      '<image class="icon-fallback" src="{{iconRing}}.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>' +
                      '</svg>' +
                    '</div>' +
                    '<div class="progress-glyph">' +
                      '<svg class="icon-m icon-64 hide-on-fallback" role="img" title="{{iconCenter}}">' +
                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#{{iconCenter}}"></use>' +
                        '<image class="icon-fallback" src="{{iconCenter}}.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">' +
                        '</image>' +
                      '</svg>' +
                    '</div>' +
                  '{{else}}' +
                    '{{#ifEquals formData ""}}'+
                    '<div class="progress-ring">' +
                      '<svg class="icon-m icon-64 hide-on-fallback" role="img" title="grey0-ring">' +
                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#grey0-ring">' +
                        '</use>' +
                        '<image class="icon-fallback" src="grey0-ring.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">' +
                        '</image>' +
                      '</svg>' +
                    '</div>' +
                    '<div class="progress-glyph">' +
                      '<svg class="icon-m icon-64 hide-on-fallback" role="img" title="edit-2ndg">' +
                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#edit-2ndg">' +
                        '</use>' +
                        '<image class="icon-fallback" src="edit-2ndg.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">' +
                        '</image>' +
                      '</svg>' +
                    '</div>' +
                    '{{else}}'+
                      '<div class="progress-ring">' +
                      '<svg class="icon-m icon-64 hide-on-fallback" role="img" title="{{iconRing}}">' +
                      '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#{{iconRing}}"></use>' +
                      '<image class="icon-fallback" src="{{iconRing}}.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>' +
                      '</svg>' +
                    '</div>' +
                    '<div class="progress-glyph">' +
                      '<svg class="icon-m icon-64 hide-on-fallback" role="img" title="{{iconCenter}}">' +
                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#{{iconCenter}}"></use>' +
                        '<image class="icon-fallback" src="{{iconCenter}}.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">' +
                        '</image>' +
                      '</svg>' +
                    '</div>' +
                    '{{/ifEquals}}'+
                  '{{/if}}'+
                  '{{else}}' +
                    '<div class="progress-ring">' +
                      '<svg class="icon-m icon-64 hide-on-fallback" role="img" title="{{iconRing}}">' +
                      '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#{{iconRing}}">' +
                      '</use>' +
                      '<image class="icon-fallback" src="{{iconRing}}.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">' +
                      '</image>' +
                      '</svg>' +
                    '</div>' +
                    '<div class="progress-glyph">' +
                      '<svg class="icon-m icon-64 hide-on-fallback" role="img" title="{{iconCenter}}">' +
                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#{{iconCenter}}">' +
                        '</use>' +
                        '<image class="icon-fallback" src="{{iconCenter}}.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">' +
                        '</image>' +
                      '</svg>' +
                    '</div>' +
                  '{{/ifEquals}}'+
                  '</div>' +
                  '<div class="select-text">' +
                    '<h5 class="title-text">{{srDescription}}</h5>' +
                    '{{#ifEquals submitStatus "draft" }}'+
                      '{{#if ckaData}}' +
                        '<p class="bt4 p2" data-id="status">'+ this.statusTitle.statusIncomplete +'</p>' +
                      '{{else}}' +
                        '{{#ifEquals formData ""}}'+
                          '<p class="bt4 p2" data-id="status">'+ this.statusTitle.statusAdd +'</p>' +
                        '{{else}}'+
                          '<p class="bt4 p2" data-id="status">'+ this.statusTitle.statusIncomplete +'</p>' +
                        '{{/ifEquals}}'+
                      '{{/if}}'+
                    '{{/ifEquals}}'+
                    '{{#ifEquals submitStatus "completed" }}'+
                      '<p class="bt4 p2" data-id="status">'+ this.statusTitle.statusCompleted +'</p>' +
                    '{{/ifEquals}}'+
                  '</div>' +
                '</div>' +
                '{{#checkPermission "srp_save_as_draft"}}' +
                '<ul class="action-list nav">' +
                  '<li>' +
                    '<a class="select-proceed" href="#" data-id="select-proceed">' +
                      '<svg class="icon-xs icon-64 hide-on-fallback" role="img" title="edit-2ndg">' +
                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#edit-2ndg">' + '</use>' +
                        '<image class="icon-fallback" src="'+ path  +'icons/edit-2ndg.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">' + '</image>' +
                      '</svg>' +
                      '{{#ifEquals formData ""}}'+
                        '<span class="h6">'+ this.statusTitle.editAdd +'</p>' +
                      '{{else}}'+
                      '<span class="h6">{{editText}}</p>' +
                      '{{/ifEquals}}'+
                    '</a>' +
                  '</li>' +
                  '<li>' +
                    '<a class="select-remove" href="#">' +
                      '<svg class="icon-xs icon-64 hide-on-fallback" role="img" title="erase-2ndg">' +
                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#erase-2ndg"></use>' +
                        '<image class="icon-fallback" src="'+ path  +'icons/erase-2ndg.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>' +
                      '</svg>' +
                      '<span class="h6">' + this.statusTitle.remove + '</p>' +
                    '</a>' +
                  '</li>' +
                '</ul>' +
                '{{/checkPermission}}' +
              '</div>'+
              '{{/each}}',
        attachment:
                  '{{#each .}}' +
                    '<li class="padding-top-xxl padding-bottom-xxl" data-id="attachments" data-submit-sr-ref="{{submitSRRefs}}" data-attachment-id="{{id}}">' +
                      '<div class="icon-wrapper">' +
                        '{{#ifEquals type "document"}}' +
                      '<svg class="icon-xs hide-on-fallback" role="img" title="claim-2nd">' +
                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="' + path +  'icons/icons.svg#claim-2nd">' +
                          '</use>' +
                          '<image class="icon-fallback" alt="claim-2nd" src="' + path + 'claim-2nd.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">' +
                          '</image>' +
                        '</svg>' +
                        '{{else}}' +
                        '<svg class="icon-xs hide-on-fallback" role="img" title="money-2nd">' +
                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="' + path +  'icons/icons.svg#money-2nd">' +
                          '</use>' +
                          '<image class="icon-fallback" alt="money-2nd" src="' + path + 'money-2nd.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">' +
                          '</image>' +
                        '</svg>' +
                        '{{/ifEquals}}' +
                      '</div>' +
                  '<div class="text-wrapper">' +
                    '<h5 class="margin-bottom-m title">{{name}}</h5>' +
                    '<p class="margin-bottom-xs description">{{desc}}</p>' +
                    '{{#checkPermission "srp_save_as_draft"}}' +
                    '<ul class="action-list nav">' +
                    '<li>' +
                      '<a class="select-proceed" href="#" data-id="upload-file">' +
                      '<img class="icon-xs" alt="upload-file" src="'+ path + 'icons/upload-file.png">'+
                      '<span class="h6">upload file</span>' +
                      '</a>' +
                    '</li>' +
                    '<li>' +
                      '<a class="select-remove" href="#" data-id="take-picture">' +
                      '<img class="icon-xs" alt="take-photo" src="' + path + 'icons/take-photo.png">' +
                      '<span class="h6">take a photo</span>' +
                      '</a>' +
                    '</li>' +
                    '</ul>' +
                    '{{/checkPermission}}' +
                    '<div class="margin-top-xxl uploaded-file-section">' +
                    '<h5 data-id="uploaded-list" {{#ifEquals files.length 0}}class="hidden"{{/ifEquals}}>Files Uploaded</h5>' +
                    '<ul class="uploaded-files">' +
                          '{{#files}}' +
                      '<li>' +
                      '<input type="file" class="hidden" name="invoice[]">' +
                      '<a class="lk2" data-id="uploaded-file" data-file-ref="{{fileRef}}" href="' + window.endPointApi + '{{url}}' + '?j=' + Site.getCookie('jbSessionId') + '&t=' + Site.getCookie('jwtToken') + '&s=' + Site.getCookie('sessionInfo') + '" target="_blank">{{name}}</a>' +
                      '{{#checkPermission "srp_save_as_draft"}}' +
                      '<button class="remove-button" type="button" aria-label="Remove" data-id="remove-file">' +
                        '<span aria-hidden="true">×</span>' +
                      '</button>' +
                      '{{/checkPermission}}' +
                      '</li>' +
                          '{{/files}}' +
                    '</ul>' +
                        '{{#ifNotEquals name "others"}}' +
                        '<p class="margin-top-m u2 hidden" data-id="validate-upload">Please upload at least 1 file</p>' +
                        '{{/ifNotEquals}}' +
                        '<p class="margin-top-m bt3 p1 hidden" data-id="processing-upload">Processing ...</p>' +
                    '</div>' +
                  '</div>' +
                  '</li>' +
                  '{{/each}}',
        itemListRequest:
                        '<p class="margin-top-m u2 hidden" data-id="no-result-sr">No POS Request match with your filter.</p>' +
                          '{{#each .}}'+
                            '<li class="{{#ifEquals srDisplayInd "N"}}hidden{{/ifEquals}}{{#if disabledStt}} disabled{{/if}}" >'+
                              '<div class="content">'+
                                '<div class="add-on-details">'+
                                  '<div class="add-on-checkbox">'+
                                    '<label class="checkbox" for="{{srCode}}">'+
                                      '<input id="{{srCode}}" type="checkbox" name="{{srCode}}" value="{{srDescription}}"' +
                                      '{{#if statusCheck}} checked {{/if}}'+
                                      '{{#if disabledStt}} disabled {{/if}}'+
                                      '>'+
                                      '<span class="indicator"><span class="tick"></span></span>'+
                                      '<span class="indicator"><span class="tick"></span></span>'+
                                      '<h5>{{srDescription}}</h5>'+
                                    '</label>'+
                                  '</div>' +
                                  '<div class="add-on-text">{{#ifEquals remoteAuthInd "Y"}} This request supports Remote Authentication{{#ifEquals srCode "SR001"}} only for <strong><u>Non Healthshield Policies</u></strong>{{else}}{{#ifEquals srCode "SR007"}} only for <strong><u>Non Healthshield Policies</u></strong>{{/if}}{{/if}}. {{else}} {{#ifEquals sgnatureAuthInd "Y"}} This request requires Signature Authentication. {{/ifEquals}}{{/ifEquals}}</div>'+
                                '</div>'+
                              '</div>'+
                            '</li>'+
                          '{{/each}}',
        wapperStepThree:
                      '{{#each.}}'+
                          '<div class="radio-button margin-bottom-m" for="{{id}}">' +
                              '<div class="radio-check">' +
                                // '{{#ifEquals checked true}}'+
                                //   '<input type="radio" id="{{id}}" name="{{id}}" data-radio-checked {{#checkPermission "srp_save_as_draft"}}{{else}}disabled{{/checkPermission}} checked>' +
                                // '{{else}}' +
                                //   '<input type="radio" id="{{id}}" name="{{id}}" {{#checkPermission "srp_save_as_draft"}}{{else}}disabled{{/checkPermission}} data-radio-checked>' +
                                // '{{/ifEquals}}'+
                                '<span class="indicator"></span>'+
                              '</div>' +
                              '<div class="add-on-text"><div class="bt3">{{{content}}} </div></div>'+
                          '</div>'+
                      '{{/each}}',

        reviewSTepFour:
                      '{{#each .}}'+
                      '<div class="review">'+
                      '<div class="heading">' +
                        '<div class="thumbnails"><img src="' + path + 'images/logos/logo-view.png" alt="logo aia"/>'+
                        '</div>'+
                        '<div class="content">'+
                          '<h4>Aia Singapore</h4>'+
                        '</div>'+
                      '</div>'+
                      '<div class="row">'+
                        '<div class="col-sm-12">'+
                          '<p class="bt8 margin-top-m w bg-k padding-left-xxs margin-bottom-m">Termination Policy</p>'+
                        '</div>'+
                      '</div>'+
                      '<div class="row margin-bottom-xl">'+
                        '<div class="col-sm-12">'+
                          '<p class="bt3 b5 margin-bottom-xs">Insured Name: {{fullNm}}</p>'+
                          '<p class="bt3 b5 margin-bottom-xs margin-bottom-l">Account No.: {{idNum}}</p>'+
                          '<div class="review-checkbox margin-bottom-m">'+
                            '<div class="icon-checkbox checked"></div><span>{{checkboxName}}</span>'+
                          '</div>'+
                          '<p class="bt3"><em>{{description}}</em></p>'+
                        '</div>'+
                      '</div>' +
                      '{{/each}}',

        methodStepFiveTitle:
                            '<div class="row">'+
                              '<div class="col-sm-12">'+
                                  '{{#ifEquals this "directAuth"}}'+
                                    '<p class="margin-bottom-l">'+
                                    'Your client is right next to you.'+
                                    '</p>'+
                                  '{{else}}'+
                                    '<p class="margin-bottom-xs margin-top-s">'+
                                    'Your client is not with you now.'+
                                    '</p>'+
                                  '{{/ifEquals}}'+
                              '</div>'+
                            '</div>',
        methodStepFiveAuth:
                          '<div class="row text-center">'+
                            '{{#each .}}'+
                              '{{#ifEquals type "oneKey"}}' +
                                '<div class="col-sm-4 col-md-3" data-type="{{type}}">'+
                              '{{else}}'+
                                '<div class="col-sm-4 col-md-3" data-type="{{type}}">'+
                              '{{/ifEquals}}'+
                                '<div class="bare-item">'+
                                  '<div class="bare-thumbnail text-center"><img src="'+ path  +'images/{{type}}.jpg" alt="{{type}}"></div>'+
                                  '<h6 class="bare-h4 p3 text-center">{{name}}</h6>'+
                                '</div>'+
                              '</div>'+
                            '{{/each}}'+
                          '</div>',
        templateLastStep:
                        '<div data-title-step6 class="data-content completed-pos margin-bottom-l">'+
                          '<div class="select-list">'+
                            '<div class="select-item padding-top-xxs padding-bottom-xxs margin-bottom-xs" data-id="check-1">'+
                              '<div class="select-top">'+
                                '<div class="thumbnail progress-thumbnail">'+
                                  '<div class="progress-ring">'+
                                    '<svg class="icon-m hide-on-fallback" role="img" title="{{iconRing}}">'+
                                      '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#{{iconRing}}"></use>'+
                                      '<image class="icon-fallback" alt="{{iconRing}}" src="'+ path +'icons/{{iconRing}}.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                                      '</svg>'+
                                '</div>'+
                                '<div class="progress-glyph">'+
                                      '<svg class="icon-s icon-64 icon-m hide-on-fallback" role="img" title="{{iconCenter}}">'+
                                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#{{iconCenter}}"></use>'+
                                        '<image class="icon-fallback" alt="{{iconCenter}}" src="'+ path +'icons/{{iconCenter}}.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                                    '</svg>'+
                                  '</div>'+
                                '</div>'+
                                '<div class="select-text">'+
                                  '<div class="title-text bt1">{{titleStatus}}: {{{lastUpdatedOnSubmit}}}</div>'+
                                  '{{#ifEquals submitStatus "pending"}}<a class="s5 bt3" href="#" data-resend-authorize-btn="true" title="Send e-mail and SMS Again?">Send e-mail and SMS Again?</a>{{/ifEquals}}'+
                                  '{{#ifEquals submitStatus "submitted"}}<a class="s5 bt3" href="#" data-resend-email-btn="true"  title="Send the PDF to customer">Send the PDF to customer</a>{{/ifEquals}}'+
                                '</div>'+
                              '</div>'+
                            '</div>'+
                          '</div>'+
                          '{{#ifEquals submitStatus "rejected"}}'+
                          '{{#if rejectReason}}<h6 class="margin-top-m margin-bottom-m">REASON FOR REJECTION</h6>'+
                          '<div class="bt3 padding-xxs border">'+
                            '{{{rejectReason}}}'+
                          '</div>{{/if}}'+
                          '{{/ifEquals}}'+
                      '</div>'
      };
    },

    initMethod: function() {
      var that = this;

      that.loadPageServiceRequest();
      that.saveAsDraft();
      that.cancelRequest();
      that.initNextPrevButton('next');
      that.initNextPrevButton('previous');
      that.parentListener();
    },

    loadAjaxResubmitForm : function(params, isCancel, funcCBError) {
      var that = this,
          opts = that.options;
      that.loadingPage.removeClass(opts.hidden);

      Site.ajaxUtil(
        isCancel ? that.options.urlCancelLinkToken : that.options.draftUrl,
        that.options.method,
        'json',
        JSON.stringify(params),
        function(response) {
          if(response.statusCode === 200) {
            Site.vars.winElem.unbind(events.beforeunload);
            window.location.reload();
          }
          that.loadingPage.addClass(opts.hidden);
          typeof funcCBError === 'function' && funcCBError(response.message);
        },
        function(error){
          that.loadingPage.addClass(opts.hidden);
          typeof funcCBError === 'function' && funcCBError(error.message);
          throw error;
        }
      );
    },

    resubmitForm: function () {
      var that = this,
          btnReSubmitForm = that.element.find('[data-id=re-submit]'),
          btnCancelSubmitForm = that.element.find('[data-id=cancel-submit]'),
          btnSubmit = that.element.find('[data-last-submit]'),
          userInfo = Site.getSessionInfo() || {},
          submitStatus = that.dataPos.submitStatus.toLowerCase(),
          isLeader = userInfo.userType === 'FSC' && userInfo.agent.agentClass > 29,
          isCancel = false;

      if( submitStatus === 'rejected' || submitStatus === 'expired' ) {
        btnReSubmitForm.removeClass('hidden');
      } else if(submitStatus === 'pending') {
        btnCancelSubmitForm.removeClass('hidden');
        isCancel = true;
      }
      if (!that.editable) {
        btnSubmit.attr('disabled', true);
      }

     btnSubmit
      .off(events.click)
      .on(events.click, function (e){
        e.preventDefault();
        var params = {
              submitRef: that.posSubmitRef,
              currentStep: 1,
              submitStatus: 'draft'
            };
        if ((submitStatus === 'rejected' || submitStatus === 'expired' || submitStatus === 'pending') && isLeader ) {
          that.editable = true;
        }

        if (!that.editable) {
            return false;
        } else {
          var description = 'Are you sure you want to re-submit Pos request?';
          isCancel &&
          (description = 'Are you sure you want to cancel Pos request?');
          createPopup({
            title: 'NOTICE',
            description: description,
            confirm: {
              id: 'confirm',
              title: 'confirm',
              class: 'btn-secondary',
              func: function() {
                that.loadAjaxResubmitForm(params, isCancel, function(message) {
                  setTimeout(function() {
                    createPopup({
                      title: 'Error Message',
                      description: message,
                      decline: {
                        id: '',
                        title: 'Close',
                        class: 'btn-primary',
                        func: function() {
                        }
                      }
                    });
                  }, 250);
                });
              }
            },
            decline: {
              id: 'close',
              title: 'Close',
              class: 'btn-secondary',
              func: function() {}
            }
          });
        }
      });
    },

    initButton: function() {
      var that = this,
          opts = that.options,
          nextBtn = that.leftServiceRequest.find('[data-next-step]'),
          prevBtn = that.leftServiceRequest.find(opts.btnPrevious),
          lastBtn = that.leftServiceRequest.find('[data-last-step]'),
          lastBtnSubmit = that.leftServiceRequest.find('[data-last-submit]');

      if (that.currentStep >= 2) {
        prevBtn.removeClass('hidden');
      } else {
        !prevBtn.hasClass('hidden') && prevBtn.addClass('hidden');
      }
      $.each(nextBtn, function(index) {
        if (index + 1 === that.currentStep) {
          $(nextBtn[index]).removeClass('hidden');
        } else {
          !$(nextBtn[index]).hasClass('hidden') && $(nextBtn[index]).addClass('hidden');
        }
      });
      if(that.currentStep > 5) {
        $(lastBtn).removeClass('hidden');
        $(lastBtnSubmit).siblings('button').addClass('hidden') ;
      }
    },

    saveAsDraftAction: function(callbackSuccess) {
      var that = this,
          opts = that.options;
      var data = {
        message: 'saveAsDraft'
      },
      params = {
        submitRef: that.posSubmitRef,
        currentStep: that.currentStep
      };
      if(that.currentStep > 5){
        typeof callbackSuccess === 'function' && callbackSuccess();
        return;
      }
      if (that.formRequest.find('iframe').length) {
        that.formRequest.find('iframe')[0].contentWindow.postMessage(data, that.targetOrgin);
        typeof callbackSuccess === 'function' && callbackSuccess();
      } else {
        if (that.currentStep === 3) {
          var tempArr = [];
          $.each($('#declaration').serializeArray(), function(index, item) {
            tempArr.push(item.name);
          });
          params.declarations = tempArr.toString();
        }
        Site.ajaxUtil(
          opts.draftUrl,
          opts.method,
          'json',
          JSON.stringify(params),
          function(response) {
            if(response.statusCode !== 200){
              popupError();
            } else {
              typeof callbackSuccess === 'function' && callbackSuccess();
            }
          },
          function(error, jqXHR) {
            jqXHR && jqXHR.status === 0 && popupError();
            throw error;
          }
        );
      }
    },

    initNextPrevButton: function(status) {
      var that = this,
        clickBtn = that.leftServiceRequest.find('[data-' + status + '-step]');

      clickBtn.off(events.click).on(events.click, function() {
        var btnVisible = $(this).siblings('[type=button]:visible').prop('disabled', true),
          thatBtn = $(this).prop('disabled', true);

        that.currentStep = status === 'next' ? that.currentStep += 1 : that.currentStep -= 1;
        that.saveAsDraftAction(function() {
          that.setCurrentStep(that.currentStep);
          that.initButton();
          that.showStep(status);
          btnVisible.prop('disabled', false);
          thatBtn.prop('disabled', false);
        });
      });
    },

    parentListener: function() {
      var that = this,
          arrayTrigger  = [],
          setInfoTrigger = function(data) {
            var triggerInfo = {
              FATCAInd: 'N',
              CRSInd: 'N',
              EDDInd: 'N'
            };
            arrayTrigger = [];
            if(data.trigger) {
              $.each(data.trigger, function(index, item) {
                if(item.srCode === 'fatca') {
                  triggerInfo.FATCAInd = item.value ? 'Y' : 'N';
                  item.srCode = that.trigger.srCodeFatca;
                }
                if(item.srCode === 'crs') {
                  triggerInfo.CRSInd = item.value ? 'Y' : 'N';
                  item.srCode = that.trigger.srCodeCrs;
                }
                if(item.srCode === 'edd') {
                  triggerInfo.EDDInd = item.value ? 'Y' : 'N';
                  item.srCode = that.trigger.srCodeEdd;
                }
                arrayTrigger.push({ srCode: item.srCode, isTrigger: item.value, parentSRSubmitRef: data.submitSRRef.toString()});
              });
              data.triggerInfo = triggerInfo;
            }
          },
          callCompleteFormFunc = function(data) {
            var srCode = that.formRequest.find('.aemform').data('sr-code');
            setInfoTrigger(data);
            that.completeForm(data);
            if(!arrayTrigger.length) {
              var itemSelect = that.selectItem.find('[data-sr-code='+ srCode +']'),
                  parentSubmitSRRef = itemSelect.data('submit-ref');

              itemSelect.data('fatca') === 'Y' &&
              srCode !== that.trigger.srCodeFatca &&
              arrayTrigger.push({ srCode: that.trigger.srCodeFatca, isTrigger: true, parentSRSubmitRef: parentSubmitSRRef });

              itemSelect.data('crs') === 'Y' &&
              srCode !== that.trigger.srCodeCrs &&
              arrayTrigger.push({ srCode: that.trigger.srCodeCrs, isTrigger: true, parentSRSubmitRef: parentSubmitSRRef });

              itemSelect.data('edd') === 'Y' &&
              srCode !== that.trigger.srCodeEdd &&
              arrayTrigger.push({ srCode: that.trigger.srCodeEdd, isTrigger: true, parentSubmitSRRef: parentSubmitSRRef });
            }
            arrayTrigger.length && that.triggerForm(arrayTrigger);
          },
          receiveMessageForm = function(e) {
            var data = e.originalEvent.data;
            switch(data.message) {
              case 'completeError':
                that.completeError(data);
                break;
              case 'completeForm':
                if(data.ortherParams && data.ortherParams.isPRCNationality) {
                  createPopup({
                    title: 'WARNING',
                    description: 'Please submit proof of entry',
                    decline: {
                      id: 'decline-delete-rider',
                      title: 'OK',
                      class: 'btn-primary',
                      func: function() {
                        callCompleteFormFunc(data);
                      }
                    }
                  });
                } else {
                  callCompleteFormFunc(data);
                }
                $('[data-id=contextual]').addClass('hidden');
                break;
              case 'saveAndQuit':
                that.saveAndQuit(data, function() {
                  data.clickProceed && that.loadForm(Site.clickProceed);
                });
                $('[data-id=contextual]').addClass('hidden');
                break;
              case 'saveAndQuitCKA':
                that.saveAndQuitCKA(data.formData, data.isCloseForm);
                break;
              case 'removeCurrentSR':
                var message = 'There are no eligible policies for this service request.';
                createPopup({
                  title: 'WARNING',
                  description: message,
                  decline: {
                    id: '',
                    title: 'close',
                    class: 'btn-primary',
                    func: function() {
                      that.loadingPage.removeClass(that.options.hidden);
                      var srCode = that.formRequest.find('.aemform').data('sr-code'),
                          elem = that.selectItem.find('[data-sr-code=' + srCode +']'),
                          submitSRRef = elem.data('submit-ref');
                      that.removeItem(elem, submitSRRef, srCode, function() {
                        that.formRequest.find('.aemform').remove();
                        that.listRequest.removeClass('hidden');
                        (initForm = false);
                        that.loadingPage.addClass(that.options.hidden);
                      });
                    }
                  }
                });
                break;
              case 'showLoading':
                that.handleFormLoading(data.isShowLoading);
                if(data.initForm) {
                  var dataForm = that.dataForm,
                      isEditWitness = false;

                  !Object.keys(JSON.parse(that.witnessData)).length && (isEditWitness = true);
                  dataForm.witnessData = that.witnessData;
                  dataForm.isEditWitness = isEditWitness;
                  that.formRequest.find('iframe')[0].contentWindow.postMessage(dataForm, that.targetOrgin);
                }
                break;
                case 'dataMapping':
                  if(data.initForm) {
                    that.dataForm.witnessData = that.witnessData;
                    that.formRequest.find('iframe')[0].contentWindow.postMessage(that.dataForm, that.targetOrgin);
                  }
                break;
              case 'showPopup':
                createPopup({
                  title: data.title,
                  description: data.content,
                  decline: {
                    id: 'decline-show-popup',
                    title: 'OK',
                    class: 'btn-primary',
                    func: function() {
                      data.completeForm && callCompleteFormFunc(data);
                      if(data.saveAndQuit) {
                        that.saveAndQuit(data);
                        $('[data-id=contextual]').addClass('hidden');
                      }
                      if (data.messageResponse) {
                        var dataSend = {
                              message: data.messageResponse
                            };
                        that.formRequest.find('iframe')[0].contentWindow.postMessage(dataSend, that.targetOrgin);
                      }
                    }
                  }
                });
                break;
              case 'policyLoan':
                that.policyLoanAction(data.formData);
                break;
              case 'scrollTop':
                $('html, body').animate({ scrollTop: $('#aemFormFrame').offset().top - 90 }, 'fast');
                break;
            }
          };
      $(window).on('message', receiveMessageForm);
    },

    setCurrentStep: function(currentStep) {
      var that = this;

      switch(currentStep) {
        case 2:
          that.loadStepTwo();
          break;
        case 3:
          that.loadStepThree();
          break;
        case 4:
          that.loadStepFour();
          break;
        case 5:
          that.loadStepFive();
          break;
        case 6:
          that.loadStepSix();
          break;
        default:
          if (that.step1.data('loadStep') !== true) {
            that.loadStepOne();
            that.step1.data('loadStep', true);
          }
          that.step1.removeClass(that.options.hidden);
          break;
      }
    },

    loadStepOne: function() {
      var that = this;

      that.loadListRequestStepOne();
      that.step1.lastNumber = 0;
      that.step1.dataObject = {};

      that.inputSearch
        .off(events.keyup)
        .on(events.keyup, this.onKeyUpSearchBar.bind(this));

      that.inputSearch
        .off(events.keyup)
        .on(events.keyup, function(e) {
          e.preventDefault();
          that.didKeySearch(e);
        });
      that.selectSearch
        .off(events.change)
        .on(events.change, function(e) {
          e.preventDefault();
          that.resetData();
          that.inputSearch.val('');
          that.filterItems(that.step1.dataObject.data, '', $(this).val());
        });

        that.btnShowMoreStep1
        .off(events.click)
        .on(events.click, function(e) {
          e.preventDefault();
          that.renderListRequest();
        });

      that.addServices();
      that.removeServices();
      that.clickProceed();
    },

    loadStepTwo: function() {
      this.handleUpload();
      this.removeUploadedFile();
      this.renderAttachment();
    },

    loadStepThree: function() {
      this.loadDataStepThree();
    },

    loadStepFour: function() {
      this.LoadDataStepFour();
    },

    loadStepFive: function() {
      this.LoadDataStepFive();
    },

    loadStepSix: function() {
      this.LoadDataStepSix();
      //this.resubmitForm();
    },

    handleFormLoading: function(isShowLoading) {
      var that = this,
          elem = that.step1,
          loadingElem = elem.find('[data-id=loading-processing-bar]'),
          aemFrameElem = elem.find('#aemFormFrame');
      if (isShowLoading) {
        aemFrameElem.addClass('hidden');
        loadingElem.hasClass('hidden') && loadingElem.removeClass('hidden');
      } else {
        !loadingElem.hasClass('hidden') && loadingElem.addClass('hidden');
        aemFrameElem.removeClass('hidden');
      }
    },

    loadPageServiceRequest: function() {
      var that = this,
          opts = that.options,
          params = { submitRef: that.element.data('submit-ref') };

      that.loadingPage.removeClass(opts.hidden);
      Site.ajaxUtil(
        that.options.url,
        that.options.method,
        'json',
        JSON.stringify(params),
        function(response) {
          that.dataPos = response.data;
          that.customerDetail = that.dataPos.customer;
          window.targetOrgin = window.location.origin;
          var customerTemplate = that.template.customerInfo.replace('{{LabelPolicyId}}', that.customerInfo.data('policy-id-lbl'))
                            .replace('{{LabelPolicyOwner}}', that.customerInfo.data('policy-owner-lbl'))
                            .replace('{{LabelCustomer}}', that.customerInfo.data('customer-lbl'));

          var customerInfo = window.Handlebars.compile(customerTemplate)(that.dataPos);

          that.customerInfo.append(customerInfo);
          that.currentStep = that.dataPos.currentStep || 1;
          if(that.dataPos.submitStatus.toLowerCase() !== 'draft') {
            that.currentStep = 6;
          }
          that.editable = that.dataPos.editable;
          that.witnessData = (that.dataPos.witnessData && that.dataPos.witnessData.trim()) ? that.dataPos.witnessData : '{}';
          if(that.dataPos.posPolicyNumber) {
            that.isPolicyId = true;
            that.policyNum = that.dataPos.policyResponse;
            that.policyNum.sourceSystem = that.dataPos.sourceSystem;
          }

          if (that.dataPos.stpSrRequests && !window._.isEmpty(that.dataPos.stpSrRequests)) {

            that.countSelectSR = that.dataPos.stpSrRequests.length;
            that.loadingPage.addClass(opts.hidden);
            that.leftServiceRequest.removeClass(opts.hidden);
            that.rightServiceRequest.removeClass(opts.hidden);

            $.each(response.data.stpSrRequests, function(key, value) {
              value.srCode === that.trigger.srCodeFatca && (that.trigger.hasFatca = true);
              value.srCode === that.trigger.srCodeCrs && (that.trigger.hasCrs = true);
              value.srCode === that.trigger.srCodeEdd && (that.trigger.hasEdd = true);
              value.parentSRSubmitRef && (value.listparentSRSubmitRef = value.parentSRSubmitRef.split(','));
            });
            that.renderItemSelect(response.data.stpSrRequests);
          }
          that.leftServiceRequest.removeClass(opts.hidden);
          that.rightServiceRequest.removeClass(opts.hidden);
          that.element.find('.date-update-step').text(that.getStringDateUpdate(response.data.lastUpdatedOn || ''));
          that.setCurrentStep(that.currentStep);
          that.showStep('next');
          that.initButton();
          that.currentStep > 5 && that.resubmitForm();
          that.disabledBtnGotoAndSaveDraft();

        },
        function() {
          var errorPath = $('#async-script').data('404-path');
          that.loadingPage.addClass(opts.hidden);
          $('#async-script').data('cq-mode') !== 'edit' &&
          window.location.replace(errorPath);
          that.loadingPage.addClass(opts.hidden);
        }
      );
    },

    saveAndQuitCKA: function(formData, isCloseForm) {
      var that = this,
          opts = that.options,
          srCode = that.formRequest.find('.aemform').data('sr-code'),
          serviceActive = that.selectItem.find('[data-sr-code=' + srCode + ']'),
          submitSRRef = serviceActive.data('submit-ref'),
          titleActive = serviceActive.find('.title-text').text(),
          params = {
              submitRef: that.posSubmitRef,
              srRequest: {
                submitSRRef: submitSRRef,
                srCode: srCode,
                submitStatus: 'draft',
                srDescription : titleActive,
                ckaData: JSON.stringify(formData)
              }
          };
      that.ckaData = JSON.stringify(formData);
      that.handleFormLoading(true);
      Site.ajaxUtil(
        that.options.draftUrl,
        that.options.method,
        'json',
        JSON.stringify(params),
        function() {
          that.changeStatusText(serviceActive, that.statusTitle.draft);
          that.changeIconStatus(serviceActive, that.statusTitle.draft);
          that.formRequest.find('.aemform').remove();
          if (isCloseForm) {
            initForm = false;
            that.listRequest.removeClass(opts.hidden);
            serviceActive.find('[data-id=status]').removeClass(opts.hidden);
            serviceActive.find('[data-id=edit]').remove();
            serviceActive.find('li.hidden').removeClass(opts.hidden);
          } else {
            that.loadIframe(submitSRRef, srCode, 'Y', that.trigger.cka.dataUrl);
          }
        },
        function(error, jqXHR) {
          jqXHR && jqXHR.status === 0 && popupError();
          that.handleFormLoading(false);
          that.loadingPage.addClass(opts.hidden);
          throw error;
        }
      );
    },

    saveAndQuit: function(data, funcCB) {
      var that = this,
          opts = that.options,
          srCode = that.formRequest.find('.aemform').data('sr-code'),
          serviceActive = that.selectItem.find('[data-sr-code=' + srCode + ']'),
          submitSRRef = serviceActive.data('submit-ref'),
          titleActive = serviceActive.find('.title-text').text(),
          params = {
              submitRef: that.posSubmitRef,
              srRequest: {
                submitSRRef: submitSRRef,
                srCode: srCode,
                submitStatus: 'draft',
                srDescription : titleActive,
                formData: JSON.stringify(data.formData),
                policyApplied: JSON.stringify(data.polNum)
              }
          };
      that.handleFormLoading(true);
      Site.ajaxUtil(
        that.options.draftUrl,
        that.options.method,
        'json',
        JSON.stringify(params),
        function() {
          serviceActive.find('li.hidden').removeClass(opts.hidden);
          that.changeStatusText(serviceActive, that.statusTitle.draft);
          that.changeIconStatus(serviceActive, that.statusTitle.draft);
          that.formRequest.find('.aemform').remove();
          that.listRequest.removeClass(opts.hidden);
          initForm = false;
          serviceActive.find('[data-id=status]').removeClass(opts.hidden);
          serviceActive.find('[data-id=edit]').remove();
          that.disabledBtnGotoAndSaveDraft();
          typeof funcCB === 'function' && funcCB();
        },
        function(error, jqXHR) {
          jqXHR && jqXHR.status === 0 && popupError();
          that.handleFormLoading(false);
          that.loadingPage.addClass(opts.hidden);
          throw error;
        }
      );
    },

    completeError: function(data) {
      var that = this,
          srCode, serviceActive, titleActive;
      srCode = this.formRequest.find('.aemform').data('sr-code');
      serviceActive = that.selectItem.find('[data-sr-code=' + srCode + ']');
      titleActive = serviceActive.find('.title-text').text();
      createPopup({
        title: 'NOTICE',
        description: 'Your submission of ‘' + titleActive.toUpperCase()  + '’ form has not been completed',
        confirm: {
          id: 'save-and-quit',
          title: 'Save & Quit',
          class: 'btn-secondary',
          func: function() {
            that.saveAndQuit(data);
          }
        },
        decline: {
          id: 'close',
          title: 'Close',
          class: 'btn-secondary',
          func: function() {}
        }
      });
    },

    completeForm: function(data) {
      var that = this,
          opts = that.options,
          srCode, serviceActive, submitSRRef, titleActive;
      srCode = that.formRequest.find('.aemform').data('sr-code');
      serviceActive = that.selectItem.find('[data-sr-code=' + srCode + ']');
      submitSRRef = serviceActive.data('submit-ref');
      titleActive = serviceActive.find('.title-text').text();
      that.handleFormLoading(true);

      var params = {
        submitRef: that.posSubmitRef,
        srRequest: {
          submitSRRef: submitSRRef,
          srCode: srCode,
          submitStatus: 'completed',
          srDescription : titleActive,
          formData: JSON.stringify(data.formData),
          policyApplied: JSON.stringify(data.polNum)
        }
      };

      if(data.triggerInfo) {
        params.srRequest.EDDInd = data.triggerInfo.EDDInd;
        params.srRequest.CRSInd = data.triggerInfo.CRSInd;
        params.srRequest.FATCAInd = data.triggerInfo.FATCAInd;
      }
      // add witness
      if(data.witnessData && Object.keys(data.witnessData).length) {
        that.witnessData = JSON.stringify(data.witnessData);
        params.witnessData = that.witnessData;
      }

      data.ortherParams &&
      (params.srRequest = $.extend({}, params.srRequest, data.ortherParams ));
      Site.ajaxUtil(
        that.options.draftUrl,
        that.options.method,
        'json',
        JSON.stringify(params),
        function() {
          that.formRequest.addClass(opts.hidden);
          that.listRequest.removeClass(opts.hidden);
          serviceActive.find('li.hidden').removeClass(opts.hidden);
          initForm = false;
          serviceActive.find('[data-id=status]').removeClass(opts.hidden)
                    .siblings('[data-id=edit]').remove();
          that.changeIconStatus(serviceActive, that.statusTitle.completed);
          that.changeStatusText(serviceActive, that.statusTitle.completed);
          that.formRequest.find('.aemform').remove();
          that.disabledBtnGotoAndSaveDraft();
          // set trigger data
          if(data.triggerInfo) {
            var itemSelect = that.selectItem.find('[data-submit-ref='+ submitSRRef +']');
            itemSelect.attr('data-edd', data.triggerInfo.EDDInd);
            itemSelect.attr('data-fatca', data.triggerInfo.FATCAInd);
            itemSelect.attr('data-crs', data.triggerInfo.CRSInd);
          }
          createPopup({
            title: titleActive,
            description: '‘' + titleActive.toUpperCase() + '’ is ready to submit',
            decline: {
              id: 'continue',
              title: 'CONTINUE',
              class: 'btn-primary',
              func: function() {}
            }
          });
        },
        function() {
          createPopup({
            title: titleActive,
            description: '‘' + titleActive.toUpperCase()  + '’ form has not been completed',
            decline: {
              id: 'continue',
              title: 'CONTINUE',
              class: 'btn-primary',
              func: function() {
                that.handleFormLoading(false);
              }
            }
          });
        }
      );
    },

    saveAsDraft: function() {
      var that = this;

      that.btnSaveAsDraft
      .off(events.click)
      .on(events.click, function(e) {
        e.preventDefault();
        that.saveAsDraftAction(function() {
          createPopup({
            title: 'MESSAGE',
            description: 'Saved as Draft. Your draft will be saved for 30 days and remains editable for 30 days.',
            decline: {
              id: 'close',
              title: 'Close',
              class: 'btn-secondary',
              func: function() {}
            }
          });
        });
      });
    },

    cancelRequest: function() {
      var that = this;
      that.btnCancelRequest
      .off(events.click)
      .on(events.click, function() {
        createPopup({
          title: 'warning',
          description: 'Do you really want to cancel POS request and go back to dashboard?',
          confirm: {
            id: 'cancel-pos',
            title: 'Yes',
            class: 'btn-primary',
            func: function() {
              Site.vars.winElem.unbind(events.beforeunload);
              that.saveAsDraftAction(function() {
                $('.modal-backdrop').remove();
                  setTimeout(function() {
                    createPopup({
                      title: 'warning',
                      description: 'Your whole submission is canceled',
                      decline: {
                        id: 'confirm-cancel-btn',
                        title: 'Close',
                        class: 'btn-secondary',
                        func: function() {
                          window.location.href= that.options.urlRedirect;
                        }
                      }
                    });
                  }, 350);
              });
            }
          },
          decline: {
            id: 'decline-pos',
            title: 'No',
            class: 'btn-secondary',
            func: function() {}
          }
        });
      });
    },

    mapDataToForm: function(formData) {
      var that = this,
          elem = that.step1,
          formInput;

      $.each(formData, function(key, value) {
        formInput = elem.find('[name=' + key + ']');
        if (formInput.is(':checkbox')) {
          elem.find('[name=' + key + '][value=' + value + ']').prop('checked', true);
        } else {
          formInput.val(value);
        }
      });
    },

    disabledBtnGotoAndSaveDraft: function() {
      var that = this,
          opts = that.options,
          elem = that.leftServiceRequest,
          flag = false,
          data = elem.find('[data-id=status]'),
          goToAttachment = elem.find(opts.btnGoTo),
          isSNumItem = that.selectItem.find('.' + opts.itemSelect).length;

      $.each(data, function(index, item) {
        if ($(item).text() !== that.statusTitle.statusCompleted) { flag = true; }
      });
      if (window._.isEmpty(data) || initForm) { flag = true; }
      if (flag) {
        goToAttachment.attr('disabled', true);
      } else {
        goToAttachment.attr('disabled') && goToAttachment.removeAttr('disabled');
      }
      isSNumItem && that.btnSaveAsDraft.removeAttr('disabled');
      !isSNumItem && that.btnSaveAsDraft.attr('disabled', true);
    },

    showStep: function (status) {
      var that = this,
          opts = that.options,
          elem = that.rightServiceRequest;

      that.rightServiceRequest.find('[data-step]').addClass(opts.hidden);
      that.rightServiceRequest.find('[data-step='+ that.currentStep +']').removeClass(opts.hidden);
       var statusStep = elem.find('[data-status-desc-step=' + that.currentStep + ']'),
           statusClickStep = elem.find('[data-status-step=' + that.currentStep + ']');

        if (status === 'next') {
          that.currentStep > 1 && that.selectItem.find('.action-list').addClass(opts.hidden);
          statusClickStep.prevAll().addClass(opts.statuscompletedStep);
        } else {
          statusClickStep.removeClass(opts.statuscompletedStep);
          statusClickStep.nextAll().removeClass(opts.statuscompletedStep);
          statusClickStep.nextAll().removeClass(opts.statusCurrentStep);
          that.currentStep > 1 &&  statusClickStep.removeClass(opts.statuscompletedStep);
          that.currentStep === 1 && that.selectItem.find('.action-list').removeClass(opts.hidden);
        }
        elem.find('[data-status-desc-step]').removeClass(opts.tabActive);
        statusStep.addClass(opts.tabActive);
        statusClickStep.addClass(opts.statusCurrentStep);
        that.currentStep > 5 && elem.find('[data-status-step]').addClass(opts.statuscompletedStep);
    },

    // Step 1
    addServices: function() {
      var that = this,
          elem = that.listRequest;

      elem
      .off(events.click, '[data-id=submit-services]')
      .on(events.click, '[data-id=submit-services]', function(e) {
        e.preventDefault();
        if(that.isCreatingSR === true){
          return false;
        }
        var allServices = elem.find('input[type="checkbox"]'),
            avaiServices = allServices.filter(function() {
              return !this.disabled && this.checked;
            }),
            rightList = allServices.filter(function() {
              if(that.exceptList.indexOf($(this).attr('id')) === -1 && this.checked && !this.disabled) {
                return true;
              }
              return false;
            }).length;

        if (!avaiServices.length) {
          return false;
        }
        var leftList = $('.select-list .select-item').filter(function() {
              if(that.exceptList.indexOf($(this).attr('id')) === -1) {
                return true;
              }
              return false;
            }).length;

        that.countSelectSR = leftList;

        if (rightList + leftList > that.maxSelect) {
          createPopup({
            title: 'ERROR',
            description: 'Please do not choose more than 10 POS requests per submission. <br>(Not inclusive of special declarations CKA, FATCA, CRS, EDD)',
            decline: {
              id: 'close',
              title: 'Close',
              class: 'btn-secondary',
              func: function() {}
            }
          });
          return false;
        }

        var serviceList = that.step1.dataObject.data;
        that.arrayServices = [];

        for (var i = 0; i < serviceList.length; i++) {
          if (that.arrayServicesTemp.indexOf(serviceList[i].srCode) > -1) {

            that.arrayServices.push({srCode: serviceList[i].srCode, srDescription: serviceList[i].srDescription, CRSInd: serviceList[i].CRSInd, FATCAInd: serviceList[i].FATCAInd, EDDInd: serviceList[i].EDDInd });

          }
        }

        that.addServicesLoadData(that.arrayServices);
        that.disabledBtnGotoAndSaveDraft();
        $('html, body').animate({ scrollTop: 0 }, 'fast');
      });
    },

    addServicesLoadData: function (arrayServices) {
      var that = this,
          params = {
        submitRef: that.posSubmitRef,
        serviceRequest: arrayServices
      };

      that.isCreatingSR = true;
      Site.ajaxUtil(
        that.options.urlAddListServices,
        that.options.method,
        'json',
        JSON.stringify(params),
      function(response) {
        if (response.data) {
          $.each(response.data, function(index, item) {
            var srCode = item.srCode,
                 elemInput = $('#'+ srCode);

            item.parentSRSubmitRef && (item.listparentSRSubmitRef = item.parentSRSubmitRef.split(','));
            $.each(that.step1.dataObject.data, function (indexList, itemList) {
              if (itemList.srCode === item.srCode) {
                itemList.statusCheck = true;
                itemList.disabledStt = true;
                item.CKAInd = itemList.CKAInd;
                item.srCode === that.trigger.srCodeFatca && (that.trigger.hasFatca = true);
                item.srCode === that.trigger.srCodeCrs && (that.trigger.hasCrs = true);
                item.srCode === that.trigger.srCodeEdd && (that.trigger.hasEdd = true);
              }
            });
            elemInput.prop('disabled', true);
            elemInput.parents('li').first().addClass(that.options.disabledClass);
          });
          that.arrayServicesTemp = [];
          that.renderItemSelect(response.data);
          that.isCreatingSR = false;
          that.disabledBtnGotoAndSaveDraft();
        }
       },
      function(error) {
        that.isCreatingSR = false;
        throw error;
        }
     );
    },

    triggerForm: function(arrayNameForm) {
      var that = this,
          arrayAddServices = [],
          arrayUpdateServices = [];

      that.loadingPage.addClass('hidden');
      arrayNameForm.length > 0 &&
      $.each(arrayNameForm, function(key, item) {
        $.each(that.step1.dataObject.data, function(indexList, itemList) {

          if(item.srCode === itemList.srCode) {
            if(!that.selectItem.find('[data-sr-code='+ item.srCode +']').length) {
              item.isTrigger &&
              arrayAddServices.push({
                srCode: itemList.srCode,
                srDescription: itemList.srDescription,
                CRSInd: itemList.CRSInd,
                FATCAInd: itemList.FATCAInd,
                EDDInd: itemList.EDDInd,
                parentSRSubmitRef: item.parentSRSubmitRef
              });
            } else {

              arrayUpdateServices.push({
                srCode: itemList.srCode,
                isTrigger: item.isTrigger,
                srDescription: itemList.srDescription,
                CRSInd: itemList.CRSInd,
                FATCAInd: itemList.FATCAInd,
                EDDInd: itemList.EDDInd,
                parentSRSubmitRef: item.parentSRSubmitRef
              });
            }
          }
        });
      });

      arrayAddServices.length && that.addServicesLoadData(arrayAddServices);

      if(arrayUpdateServices.length) {

        $.each(arrayUpdateServices, function(index, item) {
          if(!item.isTrigger) {
              var thisElem = that.selectItem.find('[data-sr-code='+ item.srCode +']'),
                  submitSRRef = thisElem.data('submit-ref'),
                  srCodeForm = that.formRequest.find('.aemform').data('sr-code'),
                  parentSRSubmitRef = thisElem.data('parent-submit') || '',
                  listParentSRSubmitRef = parentSRSubmitRef.split(',');

            listParentSRSubmitRef.length === 1 &&
            that.selectItem.find('[data-sr-code='+ item.srCode +']').is('[data-parent-sr-submit-ref-'+ item.parentSRSubmitRef + ']') &&
            that.removeItem(thisElem, submitSRRef, item.srCode, function() {
              item.srCode === srCodeForm &&
              that.formRequest.find('.aemform').remove() &&
              that.listRequest.removeClass('hidden') &&
              (initForm = false);
            });

            listParentSRSubmitRef.length > 1 &&
            that.updateTriggerForm(item.srCode, item.parentSRSubmitRef, true);
          } else {
            that.updateTriggerForm(item.srCode, item.parentSRSubmitRef, false);
          }
        });
      }
    },

    updateTriggerForm: function(srCode, parentSRSubmitRef, isRemove){
      var that = this,
          elem = that.selectItem.find('[data-sr-code='+ srCode +']'),
          submitSRRef = elem.data('submit-ref'),
          parentSR = elem.attr('data-parent-submit') || '',
          listParentSR = parentSR.split(','),
          params = {
            submitRef: that.posSubmitRef,
            srRequest: {
              submitSRRef: submitSRRef,
              submitStatus: 'draft',
            }
          };

      $.each(listParentSR, function(index, item) {

        if(item === parentSRSubmitRef) {
          listParentSR.splice(index, 1);
          return false;
        }
      });

      !isRemove && listParentSR.push(parentSRSubmitRef);
      params.srRequest.parentSRSubmitRef = listParentSR.join();

      Site.ajaxUtil(
        that.options.draftUrl,
        that.options.method,
        'json',
        JSON.stringify(params),
        function() {
          $.each(listParentSR, function(index, item) {
            elem.attr('data-parent-sr-submit-ref-' + item, '');
            if(elem.find('[data-id="status"]').text() === that.statusTitle.statusCompleted) {
              that.changeStatusText(elem , that.statusTitle.draft);
              that.changeIconStatus(elem, that.statusTitle.draft);
            }
          });
          elem.attr('data-parent-submit', params.srRequest.parentSRSubmitRef);
          that.disabledBtnGotoAndSaveDraft();
        },
        function(error) {
         throw error;
        }
      );
    },

    removeServices: function() {
      var that = this,
          opts = that.options,
          srCode, srCodeForm, submitSRRef, statusActive, titleActive,
          reusePopup = function(titleActive, description , func) {
            createPopup({
              title: titleActive,
              description: description,
              confirm: {
                id: 'delete',
                title: 'delete',
                class: 'btn-primary',
                func: func
              },
              decline: {
                id: 'cancel',
                title: 'cancel',
                class: 'btn-secondary',
                func: function() {}
              }
            });
          };

      that.leftServiceRequest
      .off(events.click, opts.linkRemoveItem)
      .on(events.click, opts.linkRemoveItem, function(e) {
        e.preventDefault();

        var thisElem = $(this).parents('.'+ that.options.itemSelect),
            parentSRSubmitRef = thisElem.attr('data-parent-submit');
        srCode = thisElem.data('sr-code');
        srCodeForm = that.formRequest.find('.aemform').data('sr-code');
        submitSRRef = thisElem.data('submit-ref');
        statusActive = thisElem.find('[data-id=status]').text();
        titleActive = thisElem.find('.title-text').text();

        if(parentSRSubmitRef) {
          var listParentSRSubmitRef = parentSRSubmitRef.split(','),
              hasParent = false;

          $.each(listParentSRSubmitRef, function(index, item) {
            that.selectItem.find('[data-submit-ref='+ item +']').length && (hasParent = true);
          });

          if(hasParent) {
            createPopup({
              title: '',
              description: '‘' + titleActive.toUpperCase() + '’ form can\'t be deleted!',
              decline: {
                id: 'close',
                title: 'close',
                class: 'btn-secondary',
                func: function() {}
              }
            });
            return false;
          }
        }
        var description = '‘' + titleActive.toUpperCase() + '’ form has not been completed, are you sure you want to delete?';
        statusActive.toLowerCase() === that.statusTitle.statusCompleted &&
        (description = '‘' + titleActive.toUpperCase() + '’ is ready to submit, are you sure you want to delete?');

        if (statusActive !== that.statusTitle.statusAdd) {
          if (initForm) {
            reusePopup(titleActive, description, function() {
              that.removeItem(thisElem, submitSRRef, srCode, function() {
                srCode === srCodeForm &&
                that.formRequest.find('.aemform').remove() &&
                that.listRequest.removeClass('hidden') &&
                (initForm = false);
              });
            });
          } else {
            reusePopup(titleActive, description, function() {
              that.removeItem(thisElem, submitSRRef, srCode);
            });
          }
        } else { that.removeItem(thisElem, submitSRRef, srCode); }
      });
    },

    removeItem: function(thisElem, submitSRRef, srCode, funcCB) {
      var that = this,
      params = {
            submitRef: that.posSubmitRef,
            submitSRRef: submitSRRef
          };
      Site.ajaxUtil(
        that.options.urlRemove,
        that.options.method,
        'json',
        JSON.stringify(params),
        function() {

          that.listRequest.find('input[id='+ srCode +']')
            .removeAttr('disabled checked')
            .parents('li')
            .removeClass(that.options.disabledClass)
            .removeClass(that.options.hidden);

          thisElem.remove();
          that.countSelectSR--;
          that.arrayServicesTemp.pop(srCode);
          that.checkServiceRequest([srCode], [false]);
          srCode === that.trigger.srCodeFatca &&
          (that.trigger.hasFatca = false);
          srCode === that.trigger.srCodeEdd &&
          (that.trigger.hasEdd = false);
          srCode === that.trigger.srCodeCrs &&
          (that.trigger.hasCrs = false);

          that.removeItemTrigger(submitSRRef);
          typeof funcCB === 'function' && funcCB();
          that.disabledBtnGotoAndSaveDraft();
        },
        function(error) {
          that.disabledBtnGotoAndSaveDraft();
          Site.vars.winElem.unbind(events.beforeunload);
          window.location.reload();

          throw error;
        }
      );
    },

    removeItemTrigger: function(submitSRRef) {
      var that = this,
          srCodeForm = that.formRequest.find('.aemform').data('sr-code'),
          itemTrigger = that.selectItem.find('[data-parent-sr-submit-ref-'+ submitSRRef +']'),
          arrayTempFirst = [],
          arrayTempLast = [];

        if(!itemTrigger.length) {
          return false;
        }

        $.each(itemTrigger, function(index, item){
          if($(item).data('sr-code') === that.trigger.srCodeFatca || $(item).data('sr-code') === that.trigger.srCodeEdd || $(item).data('sr-code') === that.trigger.srCodeCrs) {
            arrayTempFirst.push(item);
          } else {
            arrayTempLast.push(item);
          }
        });

        itemTrigger = [];
        itemTrigger = arrayTempFirst.concat(arrayTempLast);

        $.each(itemTrigger, function(index, item){
          var srCode = $(item).data('sr-code'),
              strParentSRSubmitRef = $(item).attr('data-parent-submit') || '',
              listParentSRSubmitRef = strParentSRSubmitRef && strParentSRSubmitRef.split(',');

          if(listParentSRSubmitRef.length > 1) {

            that.updateTriggerForm(srCode, submitSRRef, true);
           } else {

            that.listRequest.find('input[id='+ srCode +']')
            .removeAttr('disabled checked')
            .parents('li')
            .removeClass(that.options.disabledClass)
            .removeClass(that.options.hidden);
            that.countSelectSR--;
            that.arrayServicesTemp.pop(srCode);
            that.checkServiceRequest([srCode], [false]);
            that.removeItem(item, $(item).data('submit-ref'), srCode, function() {
              srCode === srCodeForm &&
              that.formRequest.find('.aemform').remove() &&
              that.listRequest.removeClass('hidden') &&
              (initForm = false);
            });
          }
       });
    },

    clickProceed : function() {
      var that = this,
          opts = that.options,
          thisProceed;
      that.leftServiceRequest
      .off(events.click, that.options.linkProceedItem)
      .on(events.click, that.options.linkProceedItem, function (e) {
        e.preventDefault();
        thisProceed = $(this);
        Site.clickProceed = thisProceed;
        if (initForm) {
          var srCode = that.formRequest.find('.aemform').data('sr-code'),
              serviceActive =  that.selectItem.find('[data-sr-code='+ srCode +']'),
              statusActive = serviceActive.find('[data-id=status]').text(),
              titleActive = serviceActive.find('.title-text').text();

          if (statusActive !== that.statusTitle.statusCompleted) {
            createPopup({
              title: 'NOTICE',
              description: 'Your submission of ‘' + titleActive.toUpperCase() + '’ form has not been completed',
              confirm: {
                id: 'close',
                title: 'Close',
                class: 'btn-primary',
                func: function() {
                }
              },
              decline: {
                id: 'save-and-quit',
                title: 'Save & Quit',
                class: 'btn-primary',
                func: function() {
                  var data = {
                    message: 'clickProceed'
                  };
                  that.formRequest.find('iframe')[0].contentWindow.postMessage(data, that.targetOrgin);
                }
              }
            });
          } else {
            initForm = false;
            serviceActive.find('li.hidden').removeClass(opts.hidden);
            serviceActive.find('[data-id=status]')
                         .removeClass(opts.hidden);
            serviceActive.find('[data-id=edit]').remove();
            that.changeIconStatus(serviceActive, statusActive);
            that.loadForm(thisProceed);
          }
        } else {
          that.loadForm(thisProceed);
        }
      });
    },

    loadForm: function(thisElem) {
      var that = this,
          opts = that.options,
          elemSelectItem = thisElem.parents('.' + opts.itemSelect),
          params = {
            srCode: elemSelectItem.data('sr-code'),
            submitSRRef: elemSelectItem.data('submit-ref'),
            CKAInd: elemSelectItem.data('cka')
          };
      $.ajax({
        url: that.selectItem.data('url'),
        type: that.selectItem.data('method'),
        data: params,
        dataType:'json'
      }).done(function(response) {

        that.trigger.cka.loadForm = false;
        that.loadIframe(elemSelectItem.data('submit-ref'), elemSelectItem.data('sr-code'), elemSelectItem.data('cka'), response.data);
      });
    },

    loadIframe: function(submitSRRef, srCode, CKAInd, dataUrl) {
      var that = this,
          opts = that.options,
          isLoadDataCKA = false,
          data,
          sendMappingData = function() {
            var params = {
              submitRef: that.posSubmitRef,
              submitSrRef: submitSRRef
            },
            dataMapping = function (response, isCKA) {
              data = {
                message: 'mapping',
                response: response,
                customerInfo: {
                  userType: Site.getSessionInfo().userType
                }
              };

              that.isPolicyId && (data.isPolicyId = that.isPolicyId);
              that.isPolicyId && (data.policyNum = that.policyNum);
              that.witnessData && (data.witnessData = that.witnessData);

              data.customerInfo = $.extend({}, data.customerInfo, that.dataPos.customer);
              that.dataForm = data;
              isLoadDataCKA = isCKA;

              if(that.selectItem.find('[data-submit-ref='+ submitSRRef +']').data('parent-submit')) {
                var strParentsSR = that.selectItem.find('[data-submit-ref='+ submitSRRef +']').data('parent-submit').split(','),
                    strParentsCode = [];

                $.each(strParentsSR, function(index, item) {
                  strParentsCode.push(that.selectItem.find('[data-submit-ref='+ item +']').data('sr-code'));
                });
                strParentsCode.length &&
                (data.parentSRCode = strParentsCode);
              }
            };

            if(that.trigger.cka.loadForm) {
              that.trigger.cka.response.data[0].ckaData = that.ckaData;
              dataMapping(that.trigger.cka.response, true);
            } else {
              Site.ajaxUtil(
                that.selectItem.data('form-url'),
                that.options.method,
                'json',
                JSON.stringify(params),
                function(response) {
                  if(dataUrl.cka) {
                    that.trigger.cka.response = response;
                    that.trigger.cka.loadForm = true;
                    Site.getSessionInfo().userType === 'FSC' && $('[data-id=contextual]').removeClass('hidden');
                  }
                  dataMapping(response, false);
                },
                function(error) { throw error; }
              );
            }
          };
          var url = dataUrl.url;
          if(dataUrl.cka && !that.trigger.cka.loadForm) {
            that.trigger.cka.dataUrl = dataUrl;
            url = dataUrl.cka.url;
          }
      $.ajax({
        url: url,
        success: function(responseHtml) {
          isLoadDataCKA && (that.trigger.cka.loadForm = false);
          initForm = true;
          that.formRequest.children().remove();
          var iframeElem = $(responseHtml).find('.aemform').addClass('service-request-form');
          iframeElem.attr('data-sr-code', srCode);
          that.formRequest.html(iframeElem.parent().html());
          that.handleFormLoading(true);
          if(!isLoadDataCKA){
            var elemSelectItem = that.selectItem.find('[data-sr-code='+ srCode +']');
            elemSelectItem.find('[data-id="select-proceed"]').parent().addClass(opts.hidden);
            elemSelectItem.find('[data-id=status]').addClass(opts.hidden);
            elemSelectItem.find('[data-id=edit]').remove();
            elemSelectItem.find('[data-id=status]').after('<p class="bt4 p2" data-id="edit">'+ that.statusTitle.inProgress +'</p>');
            elemSelectItem.find('[data-id=status]').text() === that.statusTitle.statusAdd &&
            that.changeStatusText(elemSelectItem , that.statusTitle.draft);
            that.changeIconStatus(elemSelectItem, '');
          }

          sendMappingData();
          that.listRequest.addClass(opts.hidden);
          that.formRequest.removeClass(opts.hidden);
          that.disabledBtnGotoAndSaveDraft();
        },
        error: function(error) {
          throw error;
        }
      });
    },

    changeStatus : function(status, item) {
      switch(status.toLowerCase()) {
        case 'completed':
          item.iconRing = 'green100-ring';
          item.iconCenter = 'accept-nav-2nd';
          item.editText = this.statusTitle.editCompleted;
          break;
        case 'draft':
        case 'incomplete':
          item.iconRing = 'yellow50-ring';
          item.iconCenter = 'alert-2nd';
          item.editText = this.statusTitle.editIncomplete;
          break;
        default:
          item.iconRing = 'yellow50-ring';
          item.iconCenter = 'edit-2ndg';
          item.editText = this.statusTitle.editAdd;
          break;
      }
      return item;
    },

    changeIconStatus: function(thisElem, status) {
      var service = {
            iconRing : '',
            iconCenter : '',
            editText : '',
            htmlIcon : '<div class="progress-ring">'+
                          '<svg class="icon-m icon-64 hide-on-fallback" role="img" title="{{ICONRING}}">'+
                            '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#{{ICONRING}}"></use>'+
                              '<image class="icon-fallback" alt="{{ICONRING}}" src="'+ path  +'icons/{{ICONRING}}.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                          '</svg>'+
                        '</div>'+
                        '<div class="progress-glyph">'+
                          '<svg class="icon-m icon-64 hide-on-fallback" role="img" title="{{ICONCENTER}}">'+
                            '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path  +'icons/icons.svg#{{ICONCENTER}}"></use>'+
                            '<image class="icon-fallback" alt="edit-2ndg" src="'+ path  +'icons/{{ICONCENTER}}.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                          '</svg>'+
                        '</div>'
      };
      service = this.changeStatus(status, service);
      service.htmlIcon = service.htmlIcon.replace(/{{ICONCENTER}}/g, service.iconCenter)
                          .replace(/{{ICONRING}}/g, service.iconRing);
      thisElem.find('.progress-thumbnail')
              .empty()
              .html(service.htmlIcon);
      thisElem.find('[data-id=select-proceed] span').text(service.editText);
    },

    changeStatusText: function(thisElem, statusAction) {
      var statusText = '';

      switch(statusAction) {
        case 'draft':
          statusText = this.statusTitle.statusIncomplete;
          break;
        case 'completed':
          statusText = this.statusTitle.statusCompleted;
          break;
      }
      thisElem.find('[data-id=status]').text(statusText);
    },

    onKeyUpSearchBar: function() {
      return false;
    },

    didKeySearch: function(e) {
      if (/(38|40|27)/.test(e.which)) {
        return;
      }
      var val = this.inputSearch.val(),
          type = this.selectSearch.val();
      this.resetData();
      this.filterItems(this.step1.dataObject.data, val, type);
    },

    loadListRequestStepOne: function() {
      var that = this,
          opts = that.options,
          params = { submitRef: that.element.data('submit-ref') };

      if(that.isPolicyId) {
        params.polNum = that.policyNum.polNum;
        params.sourceSystem = that.policyNum.sourceSystem;
      }
      that.loadingPage.removeClass(opts.hidden);
      Site.ajaxUtil(
        that.options.urlServiceRequest,
        that.options.method,
        'json',
        JSON.stringify(params),
        function(response) {
          if (!window._.isEmpty(response.data)) {
            that.step1.dataObject.data = response.data;
            var itemIdArray = [];

            $.each(that.selectItem.find('.' + opts.itemSelect), function(index, item) {
              itemIdArray.push($(item).data('sr-code'));
            });

            $.each(that.step1.dataObject.data, function (index, item) {
              if ($.inArray(item.srCode, itemIdArray ) !== -1) {
                item.statusCheck = true;
                item.disabledStt = true;
                var elemItem = that.selectItem.find('[data-sr-code='+ item.srCode +']');

                item.srCode !== that.trigger.srCodeFatca &&
                item.FATCAInd === 'Y' &&
                elemItem.attr('data-fatca','Y');

                item.srCode !== that.trigger.srCodeCrs &&
                item.CRSInd === 'Y' &&
                elemItem.attr('data-crs','Y');

                item.srCode !== that.trigger.srCodeEdd &&
                item.EDDInd === 'Y' &&
                elemItem.attr('data-edd','Y');

                item.CKAInd === 'Y' &&
                elemItem.attr('data-cka', item.CKAInd);
              }
            });

            var tempArr = that.step1.dataObject.data.filter(function(item) {
              return parseInt(item.priority) <= 10;
            });

            that.step1.dataObject.arrayData = tempArr.sort(function(a,b) {return (parseInt(a.priority) > parseInt(b.priority)) ? 1 : ((parseInt(a.priority) > parseInt(b.priority)) ? -1 : 0);} );

            that.renderListRequest();

            that.step1.find('[data-id=loading-processing-bar]').addClass(opts.hidden);
            that.inputSearch.attr('disabled', false);
          }
          that.loadingPage.addClass(opts.hidden);
        },
        function() {
          that.loadingPage.addClass(opts.hidden);
        }
      );
    },

    filterItems: function(data, query, type) {
      var that = this,
          regex = /^[A-Za-z]/;
      switch(type) {
        case 'A-F':
          regex = /^[A-Fa-f]/;
          break;
        case 'G-L':
          regex = /^[G-Lg-l]/;
          break;
        case 'M-R':
          regex = /^[M-Rm-r]/;
          break;
        case 'S-X':
          regex = /^[S-Xs-x]/;
          break;
        case 'Y-Z':
          regex = /^[Y-Zy-z]/;
          break;
      }

      data = data.filter(function(item) {
          return type === '' ? parseInt(item.priority) <= 10 : type === 'authentication' ? item.remoteAuthInd === 'Y' : regex.test(item.srDescription) ;
      });

      if (type === '') {
        data = data.sort(function(a,b) {return (parseInt(a.priority) > parseInt(b.priority)) ? 1 : ((parseInt(a.priority) > parseInt(b.priority)) ? -1 : 0);} );

      } else {
        data = data.sort(function(a,b) {return (a.srDescription > b.srDescription) ? 1 : ((b.srDescription > a.srDescription) ? -1 : 0);} );
      }

      this.step1.dataObject.arrayData = data.filter(function(item) {
         return item.srDisplayInd === 'Y' && item.srDescription.toLowerCase().indexOf(query.toLowerCase()) > -1;
      });

      var labelpostRequest = 'Most Frequent POS Requests';
      labelpostRequest = type === 'authentication' || type === 'frequent' ? this.selectSearch.find(':selected').text() + ' POS Requests' : 'POS Requests Name start with ['+ this.selectSearch.find(':selected').text() +']';

      that.checkServiceRequest(that.arrayServicesTemp);

      this.ListContainer.parent().find('p.bt4').text(labelpostRequest);
      this.renderListRequest();
    },

    renderListRequest: function() {
      var that = this,
          number = that.btnShowMoreStep1.data('number-show'),
          lastNumber = that.step1.lastNumber + number,
          data = [],
          liList;

      $.each(that.step1.dataObject.arrayData, function(index, item) {
        if (index >= that.step1.lastNumber && index < lastNumber) {
          data.push(item);
        }
      });

      that.step1.lastNumber = lastNumber;
      that.btnShowMoreStep1.removeClass(that.options.hidden);
      if (that.step1.dataObject.arrayData.length <= that.step1.lastNumber) {
        that.btnShowMoreStep1.addClass(that.options.hidden);
      }
      liList = window.Handlebars.compile(that.template.itemListRequest)(data);

      that.ListContainer.append(liList);

      that.ListContainer
      .off(events.change, '.add-on-checkbox input')
      .on(events.change, '.add-on-checkbox input', function() {
        var self = $(this);
        if(self.is(':checked')) {
          if(that.arrayServicesTemp.indexOf(self.attr('id')) === -1) {
            that.arrayServicesTemp.push(self.attr('id'));
          }
        } else {
          var index = that.arrayServicesTemp.indexOf(self.attr('id'));
          that.arrayServicesTemp.splice(index, 1);
        }
      });

      !this.step1.dataObject.arrayData.length && this.ListContainer.find('[data-id=no-result-sr]').removeClass('hidden');
    },

    checkServiceRequest: function(srCodeArray, isStatusArray, checkNDisable) {
      var that = this;

      if(typeof(isStatusArray) === 'undefined') {
        isStatusArray = [];
      }

      $.each(this.step1.dataObject.data, function(index, item) {
        var newStt = that.arrayServicesTemp.indexOf(item.srCode) > -1;

        if (srCodeArray.indexOf(item.srCode.toString()) > -1) {
          var finalStt = isStatusArray[index] || newStt;
          item.statusCheck = finalStt;
          if(typeof(checkNDisable) !== 'undefined') {
            item.disabledStt = finalStt;
          } else {
            item.disabledStt = false;
          }
          return;
        }
      });
    },

    resetData: function() {
      this.ListContainer.empty();
      this.step1.dataObject.arrayData = this.step1.dataObject.data;
      this.step1.lastNumber = 0;
    },

    renderItemSelect: function(data) {
      var that = this;
      $.each(data, function(index, item) {
        item = that.changeStatus(item.submitStatus, item);
      });
      var liList = window.Handlebars.compile(this.template.selectItem)(data);
      this.selectItem.append(liList);
    },
    // Step 2

    renderAttachment: function() {
      var that = this,
          elem = that.step2.find('form'),
          params = {
            submitRef: that.posSubmitRef,
          };
      that.loadingPage.removeClass(that.options.hidden);
      Site.ajaxUtil(
        that.options.urlUpload,
        that.options.method,
        'json',
        JSON.stringify(params),
        function(response) {
          var template =
              window.Handlebars.compile(that.template.attachment),
              required = response.data.filter(function(item) {
                return item.name.toLowerCase() !== 'others';
              }),
              optional = response.data.filter(function(item) {
                return item.name.toLowerCase() === 'others';
              });
          !required.length && elem.find('[data-id=required-title]').addClass('hidden');
          !optional.length && elem.find('[data-id=optional-title]').addClass('hidden');
          elem.find('[data-id=list-attachments]').html(template(required));
          elem.find('[data-id=list-optionals]').html(template(optional));
          that.handleValidate();
          that.loadingPage.addClass(that.options.hidden);
        },
        function(error) {
          that.loadingPage.addClass(that.options.hidden);
          throw error;
        }
      );
    },

    handleUpload: function() {
      var that = this,
          elem = that.step2.find('form'),
          opts = that.options,
          params, submitSRRefs, intFormAttachmentTypeId, formData,
          dataURItoBlob = function(dataURI) {
            var byteString = atob(dataURI.split(',')[1]),
                mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0],
                ab = new ArrayBuffer(byteString.length),
                ia = new Uint8Array(ab);
            for (var i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            return new Blob([ab], {type: mimeString});
          },
          grayscaleAndCompress = function(img) {
            var canvas = document.createElement('canvas'),
                maxWidth = 700,
                maxHeight = 700;
            if (img.width >= 700) {
              if (img.width > img.height) {
                canvas.width = maxWidth;
                canvas.height = (img.height / img.width) * canvas.width;
              } else {
                canvas.height = maxHeight;
                canvas.width = (img.width / img.height) * canvas.height;
              }
            } else {
              canvas.width = img.width;
              canvas.height = img.height;
            }
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height),
                newImgData = ctx.createImageData(canvas.width, canvas.height),
                originData = imgData.data,
                newData = newImgData.data,
                length = originData.length,
                i = 0, luminance;
            for (; i < length; i += 4) {
              luminance = originData[i] * 0.2126 + originData[i+1] * 0.7152 + originData[i+2] * 0.0722;
              newData[i] = newData[i+1] = newData[i+2] = luminance;
              newData[i+3] = originData[i+3];
            }
            ctx.putImageData(newImgData, 0, 0);
            return dataURItoBlob(canvas.toDataURL('image/jpeg', 0.7));
          };

      elem.off(events.change).on(events.change, 'input[type="file"]', function() {
        submitSRRefs = $(this).parents('.uploaded-files').parents('li').data('submit-sr-ref');
        intFormAttachmentTypeId = $(this).parents('.uploaded-files').parents('li').data('attachment-id');
        if (this.files.length) {
          if (this.files[0].size >= opts.fileSize) {
            Site.vars.bodyElem.find('#large-size-modal').modal('show');
            $(this).parents('li').first().remove();
          } else if ($.inArray(this.files[0].type, opts.fileTypeAllows) < 0) {
            Site.vars.bodyElem.find('#wrong-type-modal').modal('show');
            $(this).parents('li').first().remove();
          } else {
            var reader = new FileReader(),
                self = this,
                headerParams = {
                  Authorization : Site.getCookie('jwtToken') ? 'Bearer ' + Site.getCookie('jwtToken') : '',
                  JSESSIONID : Site.getCookie('jbSessionId') || '',
                  sessionInfo : Site.getCookie('sessionInfo') || ''
                };
            reader.readAsArrayBuffer(this.files[0]);
            reader.onload = function(e) {
              formData = new FormData();
              params = {
                submitRef: that.posSubmitRef,
                submitSRRefs: submitSRRefs.split(','),
                intFormAttachmentTypeId: intFormAttachmentTypeId,
                fileType: 'Attachment',
                isPDFSigned: false
              };
              var ajaxUpload = function(formData) {
                var processingText = $(self).parents('ul').first().siblings('[data-id=processing-upload]'),
                    uploadedText =
                    $(self).parents('ul').first().siblings('[data-id=uploaded-list]');
                processingText.removeClass('hidden');
                $.ajax({
                  url: elem.data('upload-api'),
                  type: elem.attr('method'),
                  data: formData,
                  cache: false,
                  contentType : false,
                  processData: false,
                  headers: headerParams,
                  success: function(response) {
                    if (response.statusCode && response.statusCode === 200) {
                      processingText.addClass('hidden');
                      uploadedText.hasClass('hidden') && uploadedText.removeClass('hidden');
                      $(self).parents('li').first()
                             .removeClass(opts.resetClass)
                             .append(listFile(response.data.fileRef, window.endPointApi + response.data.url + '?j=' + Site.getCookie('jbSessionId') + '&t=' + Site.getCookie('jwtToken') + '&s=' + Site.getCookie('sessionInfo'), response.data.name));
                    } else {
                      $(self).parents('li').first().remove();
                      processingText.addClass('hidden');
                      createPopup({
                        title: 'ERROR',
                        description: 'Error while uploading the file. Please try again!!!',
                        decline: {
                          id: 'close',
                          title: 'Close',
                          class: 'btn-secondary',
                          func: function() {}
                        }
                      });
                    }
                    that.handleValidate();
                  },
                  error: function(error) {
                    $(self).parents('li').first().remove();
                    processingText.addClass('hidden');
                    createPopup({
                      title: 'ERROR',
                      description: 'Error while uploading the file. Please try again!!!',
                      decline: {
                        id: 'close',
                        title: 'Close',
                        class: 'btn-secondary',
                        func: function() {}
                      }
                    });
                    throw error;
                  }
                });
              };
              formData.append('fileInfo', JSON.stringify(params));
              if ((/image/i).test(self.files[0].type)) {
                window.URL = window.URL || window.webkitURL;
                var blob = new Blob([e.target.result]),
                    blobURL = window.URL.createObjectURL(blob),
                    image = new Image();
                image.src = blobURL;
                image.onload = function() {
                  var editedImage = grayscaleAndCompress(image);
                  formData.append('fileAttachment', editedImage, self.files[0].name);
                  ajaxUpload(formData);
                };
              } else {
                formData.append('fileAttachment', self.files[0]);
                ajaxUpload(formData);
              }
            };
          }
        }
      });
      elem.off(events.click).on(events.click, '[data-id=upload-file], [data-id=take-picture]', function(e) {
        e.preventDefault();
        var closestList = $(this).parents('.action-list').parents('li').first(),
            fieldName = closestList.data('id'),
            total = closestList.parents('ul').first().find('[data-id=uploaded-file]').length,
            listFile = document.createElement('li'),
            inputType = $(this).data('id') === 'take-picture' ? 'accept="image/*" capture="camera"' : '';
        if (total >= elem.data('maximum-file')) {
          createPopup({
            title: 'error',
            description: 'You have uploaded ' + elem.data('maximum-file') + ' files',
            decline: {
              id: 'close',
              title: 'close',
              class: 'btn-secondary',
              func: function() {}
            }
          });
        } else {
          $(listFile).addClass(that.options.resetClass);
          $(listFile).append('<input type="file" ' + inputType + 'class="hidden" name="'+ fieldName +'[]"></input>');
          closestList.find('.uploaded-files').append(listFile);
          $(listFile).find('input[type="file"]').trigger(events.click);
        }
      });
    },

    removeUploadedFile: function() {
      var that = this,
          elem = that.step2.find('form'),
          fileRef, total, uploadedText;
      elem.find('[data-id=list-attachments], [data-id=list-optionals]')
      .off(events.click)
      .on(events.click, '[data-id=remove-file]', function() {
        fileRef = $(this).parents('li').first()
                         .find('[data-id=uploaded-file]')
                         .data('file-ref'),
        uploadedText = $(this).parents('ul').first().siblings('[data-id=uploaded-list]');
        var self = this;
        Site.ajaxUtil(
          elem.data('remove-file-api'),
          elem.attr('method'),
          'json',
          JSON.stringify({ fileRef: fileRef }),
          function(response) {
            if (response.statusCode === 200) {
              total = $(self).parents('ul').first().find('[data-id=uploaded-file]').length - 1;
              $(self).parents('li').first().remove();
              !total && uploadedText.addClass('hidden');
              that.handleValidate();
            }
          },
          function(error) { throw error; }
        );
      });
    },

    handleValidate: function() {
      var that = this,
          elem = that.step2.find('form'),
          attachments = elem.find('[data-id=list-attachments] [data-id=attachments]'),
          declaration = $('[data-id=go-to-declaration]'),
          listValidate = [],
          flag = false;
      $.each(attachments, function(index, item) {
        var obj = {
          index: index,
          total: $(item).find('[data-id=uploaded-file]').length
        };
        listValidate.push(obj);
      });
      $.each(listValidate, function(index, item) {
        var validate = $(attachments[item.index]).find('[data-id=validate-upload]');
        if (!item.total) {
          validate.removeClass('hidden');
          flag = true;
        } else {
          !validate.hasClass('hidden') && validate.addClass('hidden');
        }
      });
      if (flag) {
        declaration.attr('disabled', true);
      } else {
        declaration.attr('disabled') && declaration.removeAttr('disabled');
      }
    },

    // Step 3
    loadDataStepThree: function () {
      var that = this,
          elem = that.step3,
          opts = that.options,
          params = {
            submitRef: that.posSubmitRef,
          },
          serviceError = elem.find('[data-id=service-error]'),
          noResult = elem.find('[data-id=no-result]');

      that.loadingPage.removeClass(opts.hidden);
      Site.ajaxUtil(
        that.options.urlDeclaration,
        that.options.method,
        'json',
        JSON.stringify(params),
        function(response) {
          if (response.data) {
            that.renderHTMLStepThree(response.data);
          } else {
            noResult.removeClass('hidden');
          }
          that.loadingPage.addClass(opts.hidden);
        },
        function(error) {
          that.loadingPage.addClass(opts.hidden);
          serviceError.removeClass('hidden');
          throw error;
        }
      );
    },

    renderHTMLStepThree: function (data) {
      var elemHtml = window.Handlebars.compile(this.template.wapperStepThree)(data);
      this.step3.find('#declaration').html('').append(elemHtml);
      this.loading.addClass(this.options.hidden);
      $(this.options.btnReview).removeAttr('disabled');
    },

    // Step 4
    LoadDataStepFour: function () {
      var that = this,
          elem = that.step4,
          jbSessionId = Site.getCookie('jbSessionId') || '',
          jwtToken = Site.getCookie('jwtToken') || '',
          sessionInfo = Site.getCookie('sessionInfo') || '',
          url = window.endPointApi +'/posRequest/review/'+ that.posSubmitRef +'?j='+ jbSessionId +'&t=' + jwtToken + '&s=' + sessionInfo +'#toolbar=0';

      elem.find('.data-content').attr('data-pdf-path', url);
      elem.find('.data-content')['view-pdf']('init');
      elem.find('.data-content').find('.review-iframe').remove();
      that.loadingPage.addClass(that.options.hidden);
    },

    // Step 5
    LoadDataStepFive: function () {
      var that = this,
          opts = that.options,
          params = {
            submitRef: that.posSubmitRef
          },
          elemHtml, elemHtmlRemoteAuth;
      that.loadingPage.removeClass(opts.hidden);
      Site.ajaxUtil(
        opts.urlMethod,
        opts.method,
        'json',
        JSON.stringify(params),
        function(response) {
          if (response.data) {
            if (response.data.directAuth) {
              elemHtml = window.Handlebars.compile(that.template.methodStepFiveTitle)('directAuth');
              elemHtml = elemHtml.concat(window.Handlebars.compile(that.template.methodStepFiveAuth)(response.data.directAuth));
            }
            if (response.data.remoteAuth && response.data.remoteAuth.length) {
              elemHtmlRemoteAuth = window.Handlebars.compile(that.template.methodStepFiveTitle)('remoteAuth');
              elemHtmlRemoteAuth = elemHtmlRemoteAuth.concat(window.Handlebars.compile(that.template.methodStepFiveAuth)(response.data.remoteAuth));
            }
            that.step5.find('[data-id=select-method]').children().remove();
            that.step5.find('[data-id=select-method]').append(elemHtml, elemHtmlRemoteAuth);
            that.loadingPage.addClass(opts.hidden);
            //call response signature
            if (Site.getParamItemUrl('signatureResult') === 'success' ) {
              that.paramsSubmit.authorizationType = that.authorType.signature;
              that.responseSignature();
            } else {
              that.loadingPage.addClass(opts.hidden);
            }
            // close modal
            that.closeModal
            .off(events.click)
            .on(events.click, function() {
              var btnclose = $(this);
              btnclose.parents('.modal').modal('hide');
              if(btnclose.data('verified')){
                that.submitionFinal(that.paramsSubmit);
              }
            });

            // open modal
            that.step5.find('[data-type]')
            .off(events.click)
            .on(events.click, function() {
              var actDeviceData = {};
              switch($(this).data('type')) {
                case 'signature':
                  // call kofax
                  that.callKofax();
                break;
                case 'aiaOTP':
                  var formOTP = that.modalaiaOTP.find('[data-id=verify-otp]');
                  formOTP.parsley().reset();
                  formOTP.data('submit-ref', that.posSubmitRef);
                  formOTP.data('verify-otp', $('[data-verify-otp]').data('verify-otp'));
                  formOTP.data('verified-modal', that.modalSMSVerified.get(0));

                  formOTP['sms-handle']({
                    aiaOtpType: true,
                    method: that.options.method,
                    customerId: that.customerDetail.idNum,
                    userId: Site.getSessionInfo().userId || '',
                    numberVerifyOtp: parseInt(that.options.numberVerifyOtp),
                    verifiedModal: that.modalaiaOTP,
                    generateCallback: function() {
                      that.modalaiaOTP.find('form').parsley().reset();
                      that.modalaiaOTP.modal('show');
                    },
                    verifyCallback: function(otpInfo) {
                      that.modalaiaOTP.modal('hide');
                      that.modalSMSVerified.modal('show');
                      that.otpInfo = otpInfo;
                    }
                  });

                  formOTP['sms-handle']('handleGenerateOTP');

                  that.modalSMSVerified.off('hidden.bs.modal').on('hidden.bs.modal', function() {

                    var paramsSubmit = {
                      authorizationType: that.authorType.aia2fa,
                      otpToken: formOTP.data('otp-token') || '',
                      otpInfo: that.otpInfo
                    };
                    that.paramsSubmit = paramsSubmit;
                    that.submitionFinal(paramsSubmit);
                  });

                break;
                case 'oneKey':
                  that.loadingPage.removeClass('hidden');

                  var customerId = that.customerDetail.idNum || '',

                    getActiveDevice = function ( funcSuccess ) {
                      Site.ajaxUtil(
                        opts.onekeyQueryActDevice,
                        opts.method,
                        'json',
                        JSON.stringify({ customerId: customerId }),
                        function(response) {
                          if(response.statusCode !== 200) {
                            that.loadingPage.addClass('hidden');
                            that.modalOnkeyNoActDevice.modal('show');
                            return false;
                          }
                          actDeviceData.hardwareInfo = {};
                          actDeviceData.smsInfo = {};
                          for(var j = 0; j < response.data.length ; j++) {
                            if(response.data[j].deviceGroup.toLowerCase() === 'hardwareotpdevice') {
                              actDeviceData.hardwareInfo['serialNum'] = response.data[j].deviceId;
                              actDeviceData.hardwareInfo['deviceId'] = response.data[j].deviceId;
                            } else if(response.data[j].deviceGroup.toLowerCase() === 'smsotp') {
                              actDeviceData.smsInfo['serialNum'] = response.data[j].deviceId;
                              actDeviceData.smsInfo['deviceId'] = response.data[j].deviceId;
                            }
                          }
                          typeof funcSuccess === 'function' && funcSuccess(response.data);
                        },
                        function(error) {
                          that.loadingPage.addClass('hidden');
                          that.modalOnkeyNoActDevice.modal('show');
                          throw error;
                        },
                        opts.headerParams
                      );
                    },
                    callHasLinkedDevice = function (hardwareInfo, smsInfo) {
                      var tokenPopup = $('body').find('#addon-modal-onekey-pin'),
                          onekeyHardwareForm = tokenPopup.find('form'),
                          smsOnekeyForm = that.smsOnekey.find('form'),
                          otpTokenType = false;

                      $('[data-hardware-btn]').off('click').on('click', function() {
                        that.modalOnkey.modal('hide');
                        that.hardwareOnekey.find('form').parsley().reset();
                        that.hardwareOnekey.modal('show');

                        onekeyHardwareForm.data('verify-otp', $('[data-verify-token-otp]').data('verify-token-otp'));
                        onekeyHardwareForm.data('verified-modal', that.modalSMSVerified.get(0));

                        that.loadingPage.addClass('hidden');
                        onekeyHardwareForm['sms-handle']({
                          method: that.options.method,
                          onekeyHardwareType: true,
                          customerId: that.customerDetail.idNum,
                          deviceId: hardwareInfo.deviceId,
                          serialNum: hardwareInfo.serialNum,
                          vendorId: hardwareInfo.vendorId,
                          verifyCallback: function(otpInfo) {
                            that.hardwareOnekey.modal('hide');
                            that.modalOnkeyVerified.modal('show');
                            otpTokenType = true;
                            that.otpInfo = otpInfo;
                          },
                          callBackGetLinked: function (message) {

                            that.hardwareOnekey.modal('hide');
                            message = message + '<div class="text-left label-heavy padding-top-s">If you wish to link another registered device, please click <a class="underline s5" href="#" data-id="popup-linked-device">here</a>.<br>[Please note that you are only able to link your registered device. For new device registration, please go to the &#8220;<a class="s5 underline" target="_blank" title="Assurity Official Website" href="https://portal.assurity.sg/naf-web/public/index.do">Assurity Official Website</a>&#8221;]</div>';

                            createPopup({
                              title: 'ONEKEY ASSURITY 2FA',
                              description: message,
                              decline: {
                                id: '',
                                title: 'Close',
                                class: 'btn-secondary',
                                func: function() {
                                }
                              }
                            });

                            $('[data-id="common-popup"]')
                            .off(events.click, '[data-id="popup-linked-device"]')
                            .on(events.click, '[data-id="popup-linked-device"]', function(e) {
                              e.preventDefault();

                              $('[data-id="common-popup"]').modal('hide');
                              that.isTokenLinked = true;
                              that.modalOnkeyAgreeLinkDevice.find('button').click();
                            });
                          }
                        });
                        onekeyHardwareForm['sms-handle']('handleGenerateOTP');
                      });

                      $('[data-onekey-sms-btn]')
                      .off(events.click)
                      .on(events.click, function() {

                        smsOnekeyForm.data('verify-otp', opts.onekeySmsVerify);
                        smsOnekeyForm.data('verified-modal', that.modalOnkeyVerified.get(0));
                        smsOnekeyForm['sms-handle']({
                          method: that.options.method,
                          onekeySMSType: true,
                          numberVerifyOtp: parseInt(that.options.numberVerifyOtp),
                          customerId: that.customerDetail.idNum,
                          deviceId: smsInfo.deviceId,
                          serialNum: smsInfo.serialNum,
                          vendorId: smsInfo.vendorId,
                          link: false,
                          generateCallback: function() {

                            that.modalOnkey.modal('hide');
                            that.smsOnekey.find('form').parsley().reset();
                            that.smsOnekey.modal('show');
                          },
                          verifyCallback: function(otpInfo) {

                            that.smsOnekey.modal('hide');
                            that.modalOnkeyVerified.modal('show');
                            that.otpInfo = otpInfo;
                          },
                          callBackGetLinked: function(message) {
                            that.smsOnekey.is('.in') &&
                            that.smsOnekey.modal('hide');

                            that.modalOnkey.is('.in') &&
                            that.modalOnkey.modal('hide');

                            message = message + '<div class="text-left label-heavy padding-top-s">If you wish to link another registered device, please click <a class="underline s5" href="#" data-id="popup-linked-device">here</a>.<br>[Please note that you are only able to link your registered device. For new device registration, please go to the &#8220;<a class="s5 underline" target="_blank" title="Assurity Official Website" href="https://portal.assurity.sg/naf-web/public/index.do">Assurity Official Website</a>&#8221;]</div>';

                            createPopup({
                              title: 'ONEKEY ASSURITY 2FA',
                              description: message,
                              decline: {
                                id: '',
                                title: 'Close',
                                class: 'btn-secondary',
                                func: function() {
                                }
                              }
                            });

                            $('[data-id="common-popup"]')
                            .off(events.click, '[data-id="popup-linked-device"]')
                            .on(events.click, '[data-id="popup-linked-device"]', function(e) {
                              e.preventDefault();
                              that.isTokenLinked = false;
                              $('[data-id="common-popup"]').modal('hide');
                              that.modalOnkeyAgreeLinkDevice.find('button').click();
                            });
                          }

                        });
                        smsOnekeyForm['sms-handle']('handleGenerateOTP');
                      });

                      that.modalOnkey.find('[data-id="linked-device"]')
                      .off(events.click)
                      .on(events.click, function(e) {
                        e.preventDefault();

                        $(this).parents('.has-link-device').addClass('hidden').siblings('.not-link-device').removeClass('hidden');

                      });

                      that.modalOnkeyVerified
                      .off('hidden.bs.modal').
                      on('hidden.bs.modal', function() {

                        var paramsSubmit = {
                          authorizationType: otpTokenType ? that.authorType.onekeyToken : that.authorType.onekeySMS,
                          otpToken: that.modalOnkeyVerified.data('otp-token') || '',
                          otpInfo: that.otpInfo
                        };

                        that.loadingPage.removeClass('hidden');
                        that.paramsSubmit = paramsSubmit;
                        that.submitionFinal(paramsSubmit);
                      });
                    },

                    callNotLinkedDevice = function(hardwareInfo, smsInfo) {
                      that.isTokenLinked = false;
                      var onekeyHardwareForm = that.hardwareOnekeyLink.find('form'),
                          smsOnekeyForm = that.smsOnekeyLink.find('form');

                      that.modalOnkey
                      .find('[data-hardware-link-btn]').off(events.click)
                      .on(events.click, function() {
                        that.isTokenLinked = true;
                        that.modalOnkey.modal('hide');
                        that.modalOnkeyAgreeLinkDevice.modal('show');
                      });

                      that.modalOnkey
                      .find('[data-onekey-sms-link-btn]').off(events.click)
                      .on(events.click, function() {

                        that.modalOnkey.modal('hide');
                        that.modalOnkeyAgreeLinkDevice.modal('show');
                      });

                      that.modalOnkeyAgreeLinkDevice
                      .find('button.btn-secondary').off(events.click)
                      .on(events.click, function() {

                        if(that.isTokenLinked) {
                          that.hardwareOnekeyLink.find('form').parsley().reset();
                          that.hardwareOnekeyLink.find('input').val('');
                          that.hardwareOnekeyLink.modal('show');

                          onekeyHardwareForm.data('verify-otp',opts.onekeyVerifyTokenLink);
                          onekeyHardwareForm.data('verified-modal', that.modalSMSVerified.get(0));

                          onekeyHardwareForm['sms-handle']({
                            method: that.options.method,
                            onekeyHardwareLinkType: true,
                            customerId: that.customerDetail.idNum,
                            deviceId: hardwareInfo.deviceId,
                            serialNum: hardwareInfo.deviceId,
                            vendorId: hardwareInfo.vendorId,
                            verifyCallback: function() {
                              that.hardwareOnekeyLink.modal('hide');
                              createPopup({
                                title: 'ONEKEY ASSURITY 2FA',
                                description: 'LINK TOKEN SUCCESS.',
                                decline: {
                                  id: '',
                                  title: 'OK',
                                  class: 'btn-primary',
                                  func: function() {}
                                }
                              });
                            },
                            verifyCallbackUnLinked: function(response) {
                              that.hardwareOnekeyLink.modal('hide');
                              createPopup({
                                title: 'Warning',
                                description: response.message || 'Invalid Device ID.',
                                decline: {
                                  id: '',
                                  title: 'Close',
                                  class: 'btn-primary',
                                  func: function() {
                                    $('[data-type="oneKey"]').length &&
                                    $('[data-type="oneKey"]').click();
                                  }
                                }
                              });
                            }
                          });
                          onekeyHardwareForm['sms-handle']('handleGenerateOTP');

                        } else {
                          that.smsOnekeyLink.find('form').parsley().reset();
                          that.smsOnekeyLink.find('input').val('');
                          that.smsOnekeyLink.modal('show');
                          smsOnekeyForm.data('verify-otp', opts.onekeySmsVerifyLink);
                          smsOnekeyForm.data('verified-modal', that.modalOnkeyVerified.get(0));
                          smsOnekeyForm['sms-handle']({
                            method: that.options.method,
                            onekeySMSLinkType: true,
                            numberVerifyOtp: parseInt(that.options.numberVerifyOtp),
                            customerId: that.customerDetail.idNum,
                            deviceId: smsInfo.deviceId,
                            serialNum: smsInfo.deviceId,
                            vendorId: smsInfo.vendorId,
                            link: true,
                            verifiedModal: that.smsOnekeyLink,
                            generateCallback: function() {
                              that.smsOnekeyLink.find('form').parsley().reset();
                              that.smsOnekeyLink.modal('show');
                            },
                            verifyCallback: function() {
                              that.smsOnekeyLink.modal('hide');
                              createPopup({
                                title: 'ONEKEY ASSURITY 2FA',
                                description: 'LINK MOBILE SUCCESS.',
                                decline: {
                                  id: '',
                                  title: 'Close',
                                  class: 'btn-primary',
                                  func: function() {
                                  }
                                }
                              });
                            },
                            verifyCallbackUnLinked: function(response) {
                              that.smsOnekeyLink.modal('hide');
                              createPopup({
                                title: 'Warning',
                                description: response.message || 'Invalid Device ID.',
                                decline: {
                                  id: '',
                                  title: 'Close',
                                  class: 'btn-primary',
                                  func: function() {
                                    $('[data-type="oneKey"]').length &&
                                    $('[data-type="oneKey"]').click();
                                  }
                                }
                              });
                            }
                          });
                          smsOnekeyForm['sms-handle']('handleGenerateOTP');
                        }
                      });

                    };
                  if(customerId) {
                    getActiveDevice( function() {
                      var hardwareInfo = {},
                          smsInfo = {};

                      Site.ajaxUtil(
                        opts.assignedTokenApi,
                        that.options.method || 'POST',
                        'json',
                        JSON.stringify({customerId: customerId}),
                        function(response) {
                          if(response.statusCode !== 200) {
                            callNotLinkedDevice(actDeviceData.hardwareInfo, actDeviceData.smsInfo);
                            that.modalOnkey.find('.has-link-device').addClass('hidden')
                            .siblings('.not-link-device').removeClass('hidden');
                            that.loadingPage.addClass('hidden');
                            that.modalOnkey.modal('show');
                          }
                          var onkeyTokenRetrieve = response.data;
                          for(var i = 0 ; i < onkeyTokenRetrieve.length; i++) {
                            if(onkeyTokenRetrieve[i].model.toLowerCase() === 'hardwareotpdevice') {
                              hardwareInfo['serialNum'] = onkeyTokenRetrieve[i].serialNum;
                              hardwareInfo['deviceId'] = onkeyTokenRetrieve[i].deviceId;
                              hardwareInfo['vendorId'] = onkeyTokenRetrieve[i].vendorId;
                              that.modalOnkey.find('.has-link-device [data-device-type='+ onkeyTokenRetrieve[i].model.toLowerCase() +']').removeClass('hidden');
                              that.modalOnkey.find('.not-link-device [data-device-type='+ onkeyTokenRetrieve[i].model.toLowerCase() +']').addClass('hidden');

                            } else if(onkeyTokenRetrieve[i].model.toLowerCase() === 'smsotp') {
                              smsInfo['serialNum'] = onkeyTokenRetrieve[i].serialNum;
                              smsInfo['deviceId'] = onkeyTokenRetrieve[i].deviceId;
                              smsInfo['vendorId'] = onkeyTokenRetrieve[i].vendorId;
                              that.modalOnkey.find('.has-link-device [data-device-type='+ onkeyTokenRetrieve[i].model.toLowerCase() +']').removeClass('hidden');
                              that.modalOnkey.find('.not-link-device [data-device-type='+ onkeyTokenRetrieve[i].model.toLowerCase() +']').addClass('hidden');
                            }
                          }

                          callHasLinkedDevice(hardwareInfo, smsInfo);
                          callNotLinkedDevice(actDeviceData.hardwareInfo, actDeviceData.smsInfo);
                          that.modalOnkey.find('.has-link-device-text').addClass('hidden');
                          that.modalOnkey.find('.has-link-device')
                          .removeClass('hidden')
                          .siblings('.not-link-device').addClass('hidden');

                          onkeyTokenRetrieve.length === 1 && !that.modalOnkey.find('.has-link-device').is('hidden') &&
                          that.modalOnkey.find('.has-link-device-text').removeClass('hidden');

                          that.loadingPage.addClass('hidden');
                          that.modalOnkey.modal('show');

                        },
                        function(error) {
                          callNotLinkedDevice(actDeviceData.hardwareInfo, actDeviceData.smsInfo);

                          that.modalOnkey.find('.has-link-device')
                            .addClass('hidden')
                            .siblings('.not-link-device').removeClass('hidden');

                          that.loadingPage.addClass('hidden');
                          that.modalOnkey.modal('show');
                          throw error;
                      });
                    });
                  }
                break;
                // remoteAuthentication
                default:
                  var formRemote = that.modalRemote.find('[data-id=verify-remote]');
                  formRemote.parsley().reset();
                  if(that.dataPos.customer) {
                    that.dataPos.customer.phone &&
                    $.each(that.dataPos.customer.phone, function(index, item) {
                      if(item.phoneType === 'mobile') {

                        if(item.phoneNo) {
                          item.phoneNo = item.phoneNo.replace('-','').replace('+','').trim();
                          formRemote.find('[data-remote-sms]').val(item.phoneNo);
                        }
                      }
                    });
                    that.dataPos.customer.email &&
                    formRemote.find('[data-remote-email]').val(that.dataPos.customer.email[0].emailAddress);
                  }
                  that.modalRemote.modal('show');
                  if(!formRemote.data('binding-authen-form')) {
                    that.bindingRemoteAuthPopupForm(formRemote);
                  }
              }
            });
          }

        },
        function() {
          that.loadingPage.addClass(opts.hidden);
        }
      );
    },

    bindingRemoteAuthPopupForm: function(formRemote) {
      var that = this,
          opts = that.options,
          onSubmitProcess = false,
          submitBtn = formRemote.find('[data-id=send-remote]');

      formRemote.data('binding-authen-form', true);

      formRemote.find('[type=checkbox]')
      .off(events.change)
      .on(events.change, function() {
        var isChecked = formRemote.find('[type=checkbox]:checked').length;
        isChecked && submitBtn.attr('disabled', false);
        !isChecked && submitBtn.attr('disabled', true);
      });

      formRemote.off('submit').on('submit', function(e) {
        e.preventDefault();

        if(onSubmitProcess) {
          return false;
        }

        $(this).parsley().validate();

        if(formRemote.parsley().isValid()) {
          onSubmitProcess = true;
          submitBtn.prop('disabled', true);
        } else {
          return false;
        }

        Site.ajaxUtil(
          opts.sendRemote,
          opts.method,
          'json',
          JSON.stringify({
            customerId: that.customerDetail.idNum,
            userId: Site.getSessionInfo().userId,
            agentName: typeof(Site.getSessionInfo().agent) === 'undefined'|| Site.getSessionInfo().agent === null ? '' : Site.getSessionInfo().agent.agentName,
            submitRef: that.posSubmitRef,
            phoneNumber: formRemote.find('[data-remote-sms]').val(),
            isCheckedRemoteSms: formRemote.find('#remoteAuthSMS').prop('checked'),
            emailAddress: formRemote.find('[data-remote-email]').val(),
            isCheckedRemoteEmail: formRemote.find('#remoteAuthEmail').prop('checked')
          }),
          function(response) {
            if(response.statusCode === 200) {
              that.modalRemote.modal('hide');
              that.modalRemoteComplete.modal('show');
              that.modalRemoteComplete.off('hidden.bs.modal').on('hidden.bs.modal', function() {
                Site.vars.winElem.unbind(events.beforeunload);
                window.location.reload();
              });
            }
            onSubmitProcess = false;
            submitBtn.prop('disabled', false);
          },
          function(error) {
            that.modalRemote.modal('hide');
            $('#addon-modal-remote-send-error').modal('show');
            onSubmitProcess = false;
            submitBtn.prop('disabled', false);
            throw error;
          }
        );
      });
    },

    callKofax: function() {
      var that = this,
          opts = that.options,
          formSign,
          params = {
            aemUrl: window.location.href
          };
      that.loadingPage.removeClass(opts.hidden);
      Site.ajaxUtil(
        that.options.urlSignature,
        that.options.method,
        'json',
        JSON.stringify(params),
        function(response) {
          if(response.data.formData) {
            // append form data sign
            formSign = $('<form class="hidden form-sign" action="'+response.data.url +'" method="'+that.options.method+'"></form>');
            $.each(response.data.formData, function(index, item){
              formSign.append('<input type="hidden" name="' + index + '" value="' + item + '"/>');
            });
            var Authorization = Site.getCookie('jwtToken') ? 'Bearer ' + Site.getCookie('jwtToken') : '',
                JSESSIONID = Site.getCookie('jbSessionId') || '',
                sessionInfo = Site.getCookie('sessionInfo') || '';
            formSign.append('<input type="hidden" name="Authorization" value="' + Authorization + '"/>');
            formSign.append('<input type="hidden" name="JSESSIONID" value="' + JSESSIONID + '"/>');
            formSign.append('<input type="hidden" name="sessionInfo" value="' + sessionInfo + '"/>');
            that.step5.append(formSign);
            Site.vars.winElem.unbind(events.beforeunload);
            that.step5.find('.form-sign').submit();
          }
          that.loadingPage.addClass(opts.hidden);
        },
        function() {
          that.loadingPage.addClass(opts.hidden);
        }
      );
    },

    responseSignature: function() {
      var that = this,
          opts = that.options,
          params = {
            submitRef: that.posSubmitRef
          };
      that.loadingPage.removeClass(opts.hidden);
      window.history.replaceState(null, null, Site.deleteParamUrl('signatureResult'));
      Site.ajaxUtil(
        that.options.urlResponseSignature,
        that.options.method,
        'json',
        JSON.stringify(params),
        function(response) {
          response.data.message === 'verified' &&
          that.modalSignatureVerified.modal('show');
        },
        function() {
          that.loadingPage.addClass(opts.hidden);
        }
      );
    },

    submitionFinal: function(paramsSubmit) {
      var that = this,
          opts = that.options,
          params = {
            submitRef: typeof(paramsSubmit.posSubmitRef) !== 'undefined' ? paramsSubmit.posSubmitRef : that.posSubmitRef,
            reqType: typeof(paramsSubmit.reqType) !== 'undefined' ? paramsSubmit.reqType : 'submit',
            authorizationType: paramsSubmit.authorizationType || '',
            otpToken: paramsSubmit.otpToken || '',
            customerName: typeof(paramsSubmit.reqType) !== 'undefined' ? paramsSubmit.reqType : that.dataPos.customer.fullNm,
            otpInfo: paramsSubmit.otpInfo
          },
          popUpError = function (response) {
            var errorMessage = '';
            if(Array.isArray(response.data)) {
              $.each(response.data, function(index, item) {
                errorMessage += item.errorMessage + '<br>';
              });
            } else {
              response.data && (errorMessage = response.data.errorMessage);
            }
            createPopup({
              title: 'Warning',
              description: 'The submission failed, please submit again<br>'+ errorMessage,
              decline: {
                id: 'close',
                title: 'close',
                class: 'btn-secondary',
                func: function() {
                  that.currentStep = 1;
                  that.saveAsDraftAction(function() {
                    Site.vars.winElem.unbind(events.beforeunload);
                    window.location.reload();
                  });
                }
              }
            });
          };

      that.loadingPage.removeClass(opts.hidden);
      that.submitionStatus = true;
      Site.ajaxUtil(
        that.options.urlLastStep,
        that.options.method,
        'json',
        JSON.stringify(params),
        function(response) {
          that.loadingPage.addClass(opts.hidden);
          if(response.statusCode !== 200) {
            popUpError(response);
            return false;
          }
          Site.vars.winElem.unbind(events.beforeunload);
          window.location.reload();
        },
        function(error, jqXHR) {
          if(jqXHR && jqXHR.status === 0) {
            that.loadingPage.addClass(opts.hidden);
            createPopup({
              title: 'Warning',
              description: 'Please try to Submit again.',
              decline: {
                id: 'close',
                title: 'close',
                class: 'btn-secondary',
                func: function() {
                  return false;
                }
              }
            });
            return false;
          }
          that.loadingPage.addClass(opts.hidden);
          popUpError(error);
          throw error;
        }
      );
    },

    getStringDateUpdate: function(timeStamp) {
      if (timeStamp !== '') {
        var date = new Date(timeStamp),
        month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        hours = date.getHours(),
        ampm = date.getHours() >= 12 ? 'pm' : 'am',
        minutes = date.getMinutes();

        hours = hours < 10 ? '0' + hours : hours;
         minutes = minutes < 10 ? '0' + minutes : minutes;
        return  'Updated ' +  date.getDate().toString()  + ' ' +  month[date.getMonth()] + ', ' + hours + ':' + minutes + ' ' + ampm;
      }
      return;
    },

    LoadDataStepSix: function() {
      var that = this,
      elem = that.step6,
      optsClass = that.options;

      if(!window._.isEmpty(that.dataPos)){
        var dataLastStep = that.dataPos;

        var titleStatus = dataLastStep.submitStatus || '',
        iconRing, iconCenter, titleSubStatus = '';

        switch(titleStatus.toLowerCase()){
          case 'draft':
            titleStatus = 'Saved';
            titleSubStatus = 'Saved';
            iconRing = 'yellow100-ring';
            iconCenter= 'open-2nd';
            break;
          case 'pending':
            titleSubStatus = 'Pending Authorization';
            titleStatus = 'Submitted';
            iconRing = 'yellow100-ring';
            iconCenter= 'accept-nav-2nd';
            break;
          case 'expired':
            titleStatus = 'Expired';
            titleSubStatus = 'Expired';
            iconRing = 'grey0-ring';
            iconCenter= 'closedark-glyph';
            break;
          case 'rejected':
            titleStatus = 'Rejected';
            titleSubStatus = 'Rejected by Customer';
            iconRing = 'red100-ring';
            iconCenter= 'closedark-glyph';
            break;
          default:
            titleStatus = 'Submitted';
            titleSubStatus = 'Submitted for Processing';
            iconRing = 'green100-ring';
            iconCenter= 'accept-nav-2nd';
            $('[data-last-submit]').prev().removeClass('hidden');
        }

        that.rightServiceRequest.find('[data-status-desc-step='+ that.currentStep +'] p').text(titleSubStatus);

        var date1 = new Date(parseInt(dataLastStep.lastUpdatedOn)),
            amfm = date1.getHours() >= 12 ? ' PM' : ' AM',
            hours = date1.getHours().toString().length === 1 ? '0' + date1.getHours().toString() : date1.getHours().toString(),
            minutes = date1.getMinutes().toString().length === 1 ? '0' + date1.getMinutes().toString() :  date1.getMinutes().toString();

        dataLastStep.iconRing = iconRing;
        dataLastStep.iconCenter = iconCenter;
        dataLastStep.titleStatus = titleStatus;
        dataLastStep.lastUpdatedOnSubmit = Site.getFormatDate(dataLastStep.lastUpdatedOn) + ' ' + hours + ':' + minutes + ' ' + amfm;

        var elemHtml = window.Handlebars.compile(that.template.templateLastStep)(dataLastStep),
            titleLastStep = that.step6.find('[data-title-step6]');
        if(titleLastStep.length) {
          titleLastStep.html(elemHtml);
        } else {
          elem.find('.completed-pos').before(elemHtml);
        }
        var noResult = elem.find('[data-id=no-result]');
        !dataLastStep.masterPDFSignedUrl &&
        noResult.removeClass('hidden');
        if(dataLastStep.preloadSignedPdfUrl) {

          that.step6.find('.preload-signed-pdf').remove();
          var preloadSignedPdf = $('<iframe class="hidden preload-signed-pdf" src="'+ dataLastStep.preloadSignedPdfUrl +'"></iframe>');
          elem.append(preloadSignedPdf);
          preloadSignedPdf.on('load', function() {
            dataLastStep.masterPDFSignedUrl &&
            elem.find('[data-id=master-pdf]').html('<div class="review-iframe" style="overflow:auto;-webkit-overflow-scrolling:touch;width:100%;"><iframe id="iframe-review" src="'+ dataLastStep.masterPDFSignedUrl +'#toolbar=0" width="794" scrolling="yes" frameborder="0" height="600" /> </div>');
          });

        } else {

          dataLastStep.masterPDFSignedUrl &&
          elem.find('[data-id=master-pdf]').attr('data-pdf-path', dataLastStep.masterPDFSignedUrl).addClass('pdf-view bg-b8');
          elem.find('[data-id=master-pdf]')['view-pdf']('init');

          var urlDownload = new URL(dataLastStep.masterPDFSignedUrl.replace('/signature/tmpPdf','/signature/tmpPdf/download')),
              linkDownloadPDF = '<a target="_blank" class="icons-list margin-bottom-xs" href="'+ urlDownload.origin + '/' + urlDownload.pathname + '?j=' + urlDownload.search.split('j=')[1] +'"><img class="icon-s icon-24" src="'+ path +'icons/downloadsearchaltb-2ndg.png" /><span class="lk1">Download pdf</span></a><br />';
          elem.find('[data-id=master-pdf]').before(linkDownloadPDF);
        }

        // BIDING REMOTE AUTHEN FORM
        var formRemote = that.modalRemote.find('[data-id=verify-remote]');
        if(!formRemote.data('binding-authen-form')) {
          that.bindingRemoteAuthPopupForm(formRemote);
        }

        // BINDING RESEND BTN
        $('[data-resend-authorize-btn]')
        .off(events.click)
        .on(events.click, function() {

          that.loadingPage.removeClass(optsClass.hidden);

          var params = {
            customerId: that.customerDetail.idNum
          };

          Site.ajaxUtil(
            optsClass.resendAuthorize,
            that.options.method,
            'json',
            JSON.stringify(params),
            function(response) {
              if(response.data.phoneNumber !== '') {
                that.modalRemote.find('[data-remote-sms]').val(response.data.phoneNumber.replace('-','').replace('+', ''));
                that.modalRemote.find('#remoteAuthSMS').prop('checked');
              } else {
                that.modalRemote.find('#remoteAuthSMS').prop('checked', false);
              }
              if(response.data.email !== '') {
                that.modalRemote.find('[data-remote-email]').val(response.data.email);
                that.modalRemote.find('#remoteAuthEmail').prop('checked');
              } else {
                that.modalRemote.find('#remoteAuthEmail').prop('checked', false);
              }
              that.loadingPage.addClass(optsClass.hidden);
              that.modalRemote.modal('show');
            },
            function(error) {
              // popupError();
              throw error;
            }
          );
        });

        $('[data-resend-email-btn]').off(events.click).on(events.click, function() {
          that.modalResendPdf.modal('show');
        });
        // Resend PDF
        var formSendPdf = that.modalResendPdf.find('form');
        formSendPdf.off('submit').on('submit', function(e) {
          e.preventDefault();
          $(this).parsley().validate();
          if(formSendPdf.parsley().isValid()) {
            Site.ajaxUtil(
              optsClass.verifySendPdf,
              $(this).attr('method'),
              'json',
              JSON.stringify({
                submitRef: that.posSubmitRef,
                customerId: that.customerDetail.idNum,
                emailAddress: formSendPdf.find('[data-remote-email]').val()
              }),
              function(response) {
                that.modalResendPdf.modal('hide');
                if(response.statusCode === 200) {
                  that.modalSendPdfComplete.modal('show');
                } else {
                  $('#addon-modal-remote-send-error').modal('show');
                }
                that.modalResendPdf.modal('hide');
              },
              function(error) {
                // popupError();
                that.modalResendPdf.modal('hide');
                $('#addon-modal-remote-send-error').modal('show');
                throw error;
              }
            );
          } else {
            return false;
          }
        });

      }
      that.loading.addClass(optsClass.hidden);
    },

    policyLoanAction: function(formData) {
      var that = this;
      switch(formData.action) {
        case 'terrorist':
          createPopup({
            title: formData.title,
            description: 'As we are unable to process your request, please visit http://www.aia.com.sg  to download and send the completed service request form to us...',
            decline: {
              id: 'decline-policy-loan',
              title: 'OK',
              class: 'btn-primary',
              func: function() {
                Site.vars.winElem.unbind(events.beforeunload);
                location.reload();
              }
            }
          });
          break;
        case 'sgd':
          createPopup({
            title: formData.title,
            description: 'Instant Cheque option is not available',
            decline: {
              id: 'decline-policy-loan',
              title: 'OK',
              class: 'btn-primary',
              func: function() {
                var data = {
                  message: 'sgdOk'
                };
                that.formRequest.find('iframe')[0].contentWindow.postMessage(data, that.targetOrgin);
              }
            }
          });
          break;
        case 'softlocked':
          createPopup({
            title: 'Policy SOFTLOCKED',
            description: 'Policy is soft locked. Please choose another payment method',
            decline: {
              id: 'decline-policy-loan',
              title: 'OK',
              class: 'btn-primary',
              func: function() {
              }
            }
          });
          break;
      }
    },

    destroy: function() {
      $.removeData(this.element[0], pluginName);
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new AddServices(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {
    disabledClass: 'disabled',
    hidden: 'hidden',
    linkProceedItem: '[data-id=select-proceed]',
    linkRemoveItem: '.select-remove',
    itemSelect: 'select-item',
    btnPrevious: '[data-previous-step]',
    btnReview: '[data-id=review-pos-request]',
    btnGoTo: '[data-id=go-to-attachment]',
    statuscompletedStep: 'completed-step',
    tabActive: 'active',
    currentIndex: '[data-current-step]',
    statusCurrentStep: 'current-step',
    fileSize: 5242880,
    fileTypeAllows: ['image/jpeg', 'image/gif', 'image/png'],
    resetClass: 'reset-margin',
    loading: '[data-id=loading-processing-bar]',
  };

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });
}(jQuery, window));

;(function($, window, undefined) {
  'use strict';

  var pluginName = 'dashboard-filter';
  var userInfo = Site.getSessionInfo() || {},
      isLeader = userInfo.userType === 'FSC' && userInfo.agent.agentClass > 29;
  var debounce = function(func, wait, immediate) {
  	var timeout;
  	return function() {
  		var context = this, args = arguments;
  		var later = function() {
  			timeout = null;
  			if (!immediate) {
          func.apply(context, args);
        }
  		};
  		var callNow = immediate && !timeout;
  		clearTimeout(timeout);
  		timeout = setTimeout(later, wait);
  		if (callNow) {
        func.apply(context, args);
      }
  	};
  };

  var reformatSerializeArray = function(serializeArray) {
    var newArray = [];

    $.each(serializeArray, function(index) {
      var paramsObject = {};
      if (serializeArray[index].value) {
        paramsObject[serializeArray[index].name] = serializeArray[index].value;
        newArray.push(paramsObject);
      }
    });
    return newArray;
  };

  var addParamsToURL = function(serializeArray) {
    var reformatedData = reformatSerializeArray(serializeArray),
        paramsString = '';
    reformatedData && $.each(reformatedData, function(index) {
      paramsString += '&' + $.param(reformatedData[index]);
    });
    window.history.pushState({}, null, window.location.href.split(/[?#]/)[0] + paramsString.replace('&', '?'));
  };

  var formatURLParamsToObj = function() {
    var params = location.search.substring(1) ? decodeURI(location.search.substring(1)).split('&') : null;
    params && $.each(params, function(index, item) {
      var tempParams = item.split('=');
      if ($('[name=' + tempParams[0] + ']').is(':checkbox')) {
        $('#' + tempParams[0] + '-' + tempParams[1]).prop('checked', true);
      } else {
        $('[name=' + tempParams[0] + ']').val(tempParams[1]);
      }
    });
  };

  var getFormSerialize = function(elem, serializeArray) {
    var sortObj = {
      name: elem.find('.sort-by').attr('name'),
      value: elem.find('.sort-by').val()
    };
    serializeArray.push(sortObj);
    return serializeArray;
  };

  var events = {
    click: 'click.' + pluginName,
    change: 'change.' + pluginName
  };

  var templateUser =
    '<div class="result-table">' +
      '{{#each .}}'+
      '<div class="result-item padding-top-s padding-bottom-s card-vertical-separator-bottom">'+
        '<div class="thumbnail result-item-cell">'+
          '{{#ifEquals policyHolderGender "M"}}' +
          '<svg class="icon-m hide-on-fallback" role="img" title="malepressed-prime1">'+
            '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="' + Site.vars.assetPath + 'icons/icons.svg#malepressed-prime1"></use>'+
            '<image class="icon-fallback" src="' + Site.vars.assetPath + 'icons/malepressed-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">'+
            '</image>'+
          '</svg>' +
          '{{else}}' +
          '<svg class="icon-m hide-on-fallback" role="img" title="malepressed-prime1">'+
            '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="' + Site.vars.assetPath + 'icons/icons.svg#femalepress-prime1">'+'</use>'+
            '<image class="icon-fallback" src="' + Site.vars.assetPath + 'icons/femalepress-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">'+'</image>'+
          '</svg>' +
          '{{/ifEquals}}' +
          '<div class="agent">'+
            '<h5 class="h5 title-text">{{policyHolderName}}</h5>'+
            '<p class="bt4 b6">'+
            '{{#each serviceRequest}}'+
              '{{#ifEquals @index 0}}'+
              '{{description}} '+
              '{{/ifEquals}}'+
            '{{/each}}'+
            '{{#ifNumCond 1 serviceRequest.length }} (+{{math serviceRequest.length "-" 1}}) {{/ifNumCond}}'+
            '</p>'+
            '{{#switch submitStatus}}' +
              '{{#case "draft" break=true}}' +
                '<p class="bt4 text-color text-capitalize">Draft</p>'+
              '{{/case}}' +
              '{{#case "pending" break=true}}' +
                '<span class="status status-error text-capitalize">Pending Authorisation</span>' +
              '{{/case}}' +
              '{{#case "rejected" break=true}}' +
                '<span class="status status-error text-capitalize">Rejected by Customer</span>' +
              '{{/case}}' +
              '{{#case "expired" break=true}}' +
                '<span class="status status-error text-capitalize">Expired</span>' +
              '{{/case}}' +
              '{{#case "submitted" break=true}}' +
                '<span class="status status-good text-capitalize">Submitted for processing</span>' +
              '{{/case}}' +
              '{{#default}}' +
                '<span class="status status-error text-capitalize">{{submitStatus}}</span>'+
              '{{/default}}' +
            '{{/switch}}'+
          '</div>'+
        '</div>'+
        '<div class="result-item-cell">'+
          '<a class="agent title-day" href="{{linkPosRequest}}?sgServicePortalSubmitRef={{submitRef}}">'+
            '<p class="bt4 text-color">{{status}}</p>'+
            '<p class="bt4">at {{#formatDate}}{{ lastUpdatedOn}}{{/formatDate}}</p>'+
            '<svg class="icon-xs hide-on-fallback" role="img" title="icon-life-primary">'+
              '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="' + Site.vars.assetPath + 'icons/icons.svg#arrow-2ndg">'+
                '<image class="icon-fallback" src="' + Site.vars.assetPath + 'icons/arrow-2ndg.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">'+'</image>'+
              '</use>'+
            '</svg>'+
          '</a>'+
        '</div>'+
      '</div>' +
    '{{/each}}' +
  '</div>';

  var serializeObject = function(serializeArray) {
    var newArray = {},
        status = [];
    for(var i = 0; i < serializeArray.length; i++) {
      if (serializeArray[i]['name'] === 'status') {
        status.push(serializeArray[i]['value']);
        newArray.status = status;
      } else {
        newArray[serializeArray[i]['name']] = serializeArray[i]['value'];
      }
    }
    return newArray;
  };

  var renderFilterData = function(elem, params, serviceURL) {
    var loading = elem.find('.loading-result'),
        noResult = elem.find('[data-id=no-result]'),
        serviceError = elem.find('[data-id=service-error]'),
        filterResult = elem.find('[data-id=filter-result]'),
        sessionInfo = Site.getSessionInfo();

    loading.removeClass('hidden');
    !noResult.hasClass('hidden') && noResult.addClass('hidden');
    !serviceError.hasClass('hidden') && serviceError.addClass('hidden');
    filterResult.html('');
    if(isLeader) {
      params.filterAgentLeader = true;
    } else {
      params.filterAgentLeader = false;
    }
    params.agentNum && (params.filterAgentLeader = false);

    if(!localStorage.getItem('filterDashboard') && !params.agentNum) {
      params.agentNum = sessionInfo.agent && sessionInfo.agent.agentNum || '';
    }
    Site.ajaxUtil(
      serviceURL,
      elem.find('#filter-form').attr('method'),
      'json',
      JSON.stringify(params),
      function(response) {
        if (response.total) {
          var template = window.Handlebars.compile(templateUser);
          $.each(response.data, function(index) {
            var data = response.data[index];
            data.status = Site.getSubStatus(data.submitStatus);
            data.linkPosRequest = elem.data('link-pos');
          });

          loading.addClass('hidden');
          filterResult.html(template(response.data));
        } else {
          loading.addClass('hidden');
          noResult.removeClass('hidden');
        }
        if (response.team && response.team.length && elem.find('[data-id=leader-select] option').length <= 1) {
          var teamOptions = '';
          $.each(response.team, function(index, item) {
            teamOptions += '<option value="' + item.agentNum + '">' + item.agentName + '</option>';
          });
          elem.find('[data-id=leader-select]').append(teamOptions);
        }
      },
      function(error) {
        loading.addClass('hidden');
        serviceError.removeClass('hidden');
        throw error;
      }
    );
  };

  function DashboardFilter(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  DashboardFilter.prototype = {
    init: function() {
      var that = this,
          elem = that.element,
          opts = that.options,
          filterForm = elem.find(opts.form);
      Site.renderTitlePage();
      formatURLParamsToObj();
      that.initMonthFilter();
      that.filterURL = filterForm.attr('action');
      var paramsFilterAll = serializeObject(getFormSerialize(elem, filterForm.serializeArray()));
      renderFilterData(elem, paramsFilterAll, that.filterURL);
      that.showHideFilter();
      that.sendFilterParams();
      that.clearFilter();
      if (localStorage.getItem('filterDashboard')) {
        elem.find('[data-id=leader-block]').removeClass('hidden');
        elem.find('[data-id=leader-btn]').off(events.click).on(events.click, function() {
          var reqBody = serializeObject(getFormSerialize(elem, filterForm.serializeArray()));
          reqBody.agentNum = elem.find('[data-id=leader-select]').val();
          renderFilterData(elem, reqBody, that.filterURL);
        });
      }

      Site.checkPermission('srp_search_view_all', function() {
        elem.find('[data-search-bar]').remove();
      });

      Site.checkPermission('srp_filter_view_all', function() {
        elem.find('[data-filter-bar]').remove();
      });

      window.location.href.match(/\?./) && elem.find('[data-id=accordion-expand]').trigger(events.click);
    },

    showHideFilter: function() {
      var elem = this.element,
          accordionExpand = elem.find('[data-id=accordion-expand]'),
          accordionCollapse = elem.find('[data-id=accordion-collapse]');

      accordionExpand.off(events.click).on(events.click, function() {
        elem.find('.filter-field').slideDown();
        $(this).addClass('hide');
        accordionCollapse.removeClass('hide');
      });

      accordionCollapse.off(events.click).on(events.click, function() {
        elem.find('.filter-field').slideUp();
        $(this).addClass('hide');
        accordionExpand.removeClass('hide');
      });
    },

    sendFilterParams: function() {
      var that = this,
          elem = that.element,
          opts = that.options,
          filterForm = elem.find(opts.form + ', .sort-by'),
          formSerialize;

      filterForm.off(events.change).on(events.change, function() {
        formSerialize = getFormSerialize(elem, elem.find(opts.form).serializeArray());
        addParamsToURL(formSerialize);
        debounce(renderFilterData(elem, serializeObject(formSerialize), that.filterURL), 200);
      });
    },

    clearFilter: function() {
      var that = this,
          elem = that.element,
          opts = that.options,
          formSerialize;

      elem.find('[data-id=clear-filter]')
        .off(events.click)
        .on(events.click, function() {
          elem.find(opts.form).trigger('reset');
          elem.find(opts.form + ' input[type=checkbox]').removeAttr('checked');
          formSerialize = getFormSerialize(elem, elem.find(opts.form).serializeArray());
          addParamsToURL(formSerialize);
          renderFilterData(elem, serializeObject(formSerialize), that.filterURL);
        });
    },

    destroy: function() {
      $.removeData(this.element[0], pluginName);
    },

    initMonthFilter: function() {
      var now = new Date();
      var month = now.getMonth() + 1;
      var year = now.getFullYear();      
      for(var x=0; x < 12; x++) {
        var displayMonth = ('0' + month).slice(-2);
        $('.month-filter').append($('<option>', { 
            value:  year + '-' + displayMonth,
            text : displayMonth + '/' +  year
        }));
        
        if(month === 1) {
          month = 12;
          year--;
        } else {
          month--;
        }
      }      
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new DashboardFilter(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {
    form: '#filter-form'
  };

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });

}(jQuery, window));

;(function($, window, undefined) {
  'use strict';

  var pluginName = 'footer-fix';

  function Plugin(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  Plugin.prototype = {
    init: function() {
      var that = this,
          winWidth;
      Site.vars.winElem.on('load', function(){
          that.footerHeight();
      });
      winWidth = Site.vars.winElem.width();
      Site.vars.winElem.on('resize.' + pluginName, function() {
        var tempWidth = Site.vars.docElem.width();
        if (winWidth !== tempWidth) {
          winWidth = tempWidth;
          that.footerHeight();
        }
      });
    },

    footerHeight: function() {
      var that = this,
          opts = that.options,
          footerHeight = $(opts.classFooter).height(),
          headerHeight = $(opts.classHeader).height();

      $(opts.classFooter).css('opacity' ,'1');
      $(opts.classMain).removeAttr( 'style' );

      $(opts.classMain).css('min-height', Site.vars.winElem.height() - footerHeight -headerHeight);

    },

    destroy: function() {
      // remove events
      // deinitialize
      $.removeData(this.element[0], pluginName);
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new Plugin(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {
    classHeader : 'header',
    classFooter : '.footer',
    classMain : '.main-wrapper'
  };

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });

}(jQuery, window));

;(function($, window, undefined) {
  'use strict';

  var pluginName = 'header-bar';

  function HeaderBar(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  HeaderBar.prototype = {
    init: function() {
      this.initDOM();
      this.dy = null;
      this.dyPrev = 0;
      this.scrollDetectRefreshInterval = 250;
      this.slimY = this.navBar.height() - this.slimBar.height();
      this.setElementSizes();

      Site.vars.winElem.on('scroll.aia.navbar', function () {
        this.didScroll = true;
      }.bind(this));

      this.screenSmallMediaQuery.addListener(this.setElementSizes.bind(this));
      this.screenShmediumMediaQuery.addListener(this.setElementSizes.bind(this));
      this.checkScrollInterval = setInterval(function () {
        if (this.didScroll) {
          this.hasScrolled();
          this.didScroll = false;
        }
      }.bind(this), this.scrollDetectRefreshInterval);
    },

    initDOM: function () {
      this.navBar = this.element.find('.navbar.navbar-default');
      this.navBarZero = this.navBar.find('.navbar-zero');
      this.slimBar = this.navBar.find('.navbar-slim');
      this.screenSmallMediaQuery = window.matchMedia('(min-width: 768px)');
      this.screenShmediumMediaQuery = window.matchMedia('(min-width: 1025px)');
    },

    setElementSizes: function (){
      if (this.screenShmediumMediaQuery.matches) {
        if (this.navBarZero.length && this.navBarZero.is(':visible')) {
          this.navBarOffsetClass = 'navbar-offset-sd-zero';
        } else {
          this.navBarOffsetClass = 'navbar-offset-sd';
        }
      } else {
        if (this.screenSmallMediaQuery.matches) {
          this.navBarOffsetClass = 'navbar-offset-sm';
        } else {
          if ($('body.ie8').length > 0) {
            this.navBarOffsetClass = 'navbar-offset-sd';
          } else {
            this.navBarOffsetClass = 'navbar-offset-xs';
          }
        }
      }
      if ((this.navBar).hasClass('navbar-fixed-slim')) {
        this.navBar.removeClass('navbar-offset-xs navbar-offset-sm navbar-offset-sd navbar-offset-sd-zero');
        this.navBar.addClass(this.navBarOffsetClass);
      }
    },
    hasScrolled: function () {
      this.dy = Site.vars.winElem.scrollTop();
      if (Math.abs(this.dyPrev - this.dy) <= this.delta) {
        return;
      }
      if (this.dy > this.dyPrev && this.dy > this.slimY) {
        this.navBar.addClass('navbar-fixed-slim').addClass(this.navBarOffsetClass);
        this.slimBar.on('mouseenter.aia.navbar', this.hoverExpandNavBar.bind(this));
      } else {
        this.navBar.removeClass('navbar-fixed-slim');
        this.navBar.removeClass('navbar-offset-xs navbar-offset-sm navbar-offset-sd navbar-offset-sd-zero');
        this.slimBar.off('mouseenter.aia.navbar');
      }
      this.dyPrev = this.dy;
    },

    hoverExpandNavBar: function(){
      if (this.screenShmediumMediaQuery.matches) {
        this.navBar.removeClass('navbar-fixed-slim');
        this.navBar.removeClass('navbar-offset-xs navbar-offset-sm navbar-offset-sd navbar-offset-sd-zero');
        this.navBar.on('mouseleave.aia.navbar', this.hoverShrinkNavbar.bind(this));
      }
    },

    hoverShrinkNavbar : function () {
      this.navBar.addClass('navbar-fixed-slim').addClass(this.navBarOffsetClass);
      this.navBar.off('mouseleave.aia.navbar');
    },

    destroy: function() {
      $.removeData(this.element[0], pluginName);
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new HeaderBar(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {};

  $(function() {

    $('[data-' + pluginName + ']')[pluginName]();
  });

}(jQuery, window));

;(function($, window, undefined) {
  'use strict';
  var pluginName = 'load-dashboard',
      events = {
        click: 'click.'+ pluginName
      },
      path = Site.vars.assetPath;

  function LoadDashboard(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  LoadDashboard.prototype = {
    init: function() {
      var that = this,
          opts = that.options;
      that.vars = {
        showDefault: 2,
        size: parseInt(opts.size),
        isLoadUam: false
      };
      Site.renderTitlePage();
      that.loadUam();

      $('body a')
      .off(events.click)
      .on(events.click , function() {
        if(that.vars.isLoadUam === true) {
          return false;
        }
      });

      that.element
      .off(events.click, opts.class.btnShowMore)
      .on(events.click, opts.class.btnShowMore , function(e) {
        e.preventDefault();
        that.showMore($(this));
      });

      if (Site.getSessionInfo().agent && Site.getSessionInfo().agent.agentClass >= 30) {
        that.element.siblings('[data-id=member-view]').removeClass('hidden');
        that.element.siblings('[data-id=member-view]').off(events.click).on(events.click, function() {
          localStorage.setItem('filterDashboard', 'member');
        });
      }
    },

    initDomAndLoadData: function() {
      var that = this;
      that.initDom();
      that.loadData();
    },

    loadUam: function() {
      var that = this;
      if(localStorage.isDemoSso === 'false') {
        localStorage.removeItem('isDemoSso');
        that.vars.isLoadUam = true;
        
        Site.ajaxUtil(
          that.options.linkUam,
          that.options.method,
          'json',
          null,
          function(response) {
            that.vars.isLoadUam = false;
            response.data.uamResponse && localStorage.setItem('userPermission', response.data.uamResponse);
            that.initDomAndLoadData();
          },
          function() {
            console.log('load uam error');
          }
        );
      } else {
        that.initDomAndLoadData();
      }          
    },

    initDom: function() {
      this.btnShowMore = this.element.find('[data-id=show-more]');
      this.loading = this.element.siblings('[data-id=loading-processing]');
      this.noResultText = this.element.siblings('[data-id=no-result]');
      this.errorResultText = this.element.siblings('[data-id=error-result]');
      this.template = {
        listWapper: '{{#each .}}'+
                     '{{#ifNumCond 0 this.total}}'+
                     '{{#checkPermission "srp_dash_view_sr"}}'+
                    '<div class="result margin-bottom-3xl">'+
                    '<div class="result-header clearfix" data-id="status" data-status ="{{@key}}"> '+
                      '<div class="h6 pull-left padding-bottom-xxs">'+
                      '{{#ifEquals @key "draft"}}'+
                        '<span class="padding-right-xxs">DRAFT</span>'+
                      '{{/ifEquals}}'+
                        '{{#ifEquals @key "pending"}}'+
                      '<span class="padding-right-xxs">PENDING AUTHORISATION</span>'+
                      '{{/ifEquals}}'+
                        '{{#ifEquals @key "rejected"}}'+
                      '<span class="padding-right-xxs">REJECTED BY CUSTOMER</span>'+
                      '{{/ifEquals}}'+
                        '{{#ifEquals @key "expired"}}'+
                      '<span class="padding-right-xxs">EXPIRED</span>'+
                      '{{/ifEquals}}'+
                        '{{#ifEquals @key "submitted"}}'+
                      '<span class="padding-right-xxs">SUBMITTED FOR PROCESSING</span>'+
                      '{{/ifEquals}}'+
                      '<span>({{total}})</span></div>' +
                      '{{#checkPermission "srp_dash_view_all"}}' +
                        '<a class="lk1 pull-right" href="{{linkFilter}}" data-id="see-all">{{SEEALLTEXT}}<span class="link-arrow"></span></a>'+
                      '{{/checkPermission}}' +
                    '</div>'+
                  '<div class="result-table" data-id="result-table">'+
                      '{{#each data}}'+
                       '{{#ifNumCond @index 2}}'+
                      '<div class="result-item padding-top-s padding-bottom-s card-vertical-separator-bottom">'+
                          '<div class="thumbnail result-item-cell">'+
                            '{{#ifEquals policyHolderGender "M"}}'+
                            '<svg class="icon-m hide-on-fallback" role="img" title="malepressed-prime1">'+
                              '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#malepressed-prime1"></use>'+
                              '<image class="icon-fallback" src="'+ path +'icons/malepressed-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                            '</svg>'+
                            '{{else}}'+
                            '<svg class="icon-m hide-on-fallback" role="img" title="icon-life-primary">'+
                              '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#femalepress-prime1"></use>'+
                              '<image class="icon-fallback" src="'+ path +'icons/femalepress-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                            '</svg>'+
                            '{{/ifEquals}}'+
                            '<div class="agent">'+
                              '<h5 class="title-text">{{{policyHolderName}}}</h5>'+
                              '<p class="bt4 b6">'+
                               '{{#each serviceRequest}}'+
                                '{{#ifEquals @index 0}}'+
                               '{{description}} '+
                                '{{/ifEquals}}'+
                               '{{/each}}'+
                              '{{#ifNumCond 1 serviceRequest.length }} (+{{math serviceRequest.length "-" 1}}) {{/ifNumCond}}'+
                               '</p>'+
                               '{{#ifEquals submitStatus "draft"}}'+
                               '<span class="status text-capitalize">Draft</p>'+
                             '{{/ifEquals}}'+
                               '{{#ifEquals submitStatus "pending"}}'+
                             '<span class="status status-error text-capitalize">Pending Authorisation</span>'+
                             '{{/ifEquals}}'+
                               '{{#ifEquals submitStatus "rejected"}}'+
                             '<span class="status status-error text-capitalize">Rejected by Customer</span>'+
                             '{{/ifEquals}}'+
                               '{{#ifEquals submitStatus "expired"}}'+
                             '<span class="status status-error text-capitalize">Expired</span>'+
                             '{{/ifEquals}}'+
                               '{{#ifEquals submitStatus "submitted"}}'+
                             '<span class="status status-good text-capitalize">Submitted for processing</span>'+
                             '{{/ifEquals}}'+
                           ' </div>'+
                          '</div>'+
                          '<div class="result-item-cell">'+
                          '{{#checkPermission "srp_dash_action_sr"}}'+
                            '<a class="agent title-day" href="{{linkPosRequest}}?sgServicePortalSubmitRef={{submitRef}}">'+
                              '<p class="bt4"> {{#getSubStatus }}{{submitStatus}}{{/getSubStatus}} on {{#formatDate}}{{lastUpdatedOn}}{{/formatDate}} </p>' +
                              '<svg class="icon-xs hide-on-fallback" role="img" title="arrow-2ndg">'+
                                '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#arrow-2ndg"></use>'+
                                '<image class="icon-fallback" alt="arrow-2ndg" src="'+ path +'icons/arrow-2ndg.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                              '</svg>'+
                            '</a>'+
                            '{{/checkPermission}}'+
                          '</div>'+
                       '</div>'+
                       '{{/ifNumCond}}'+
                      '{{/each}}'+
                      '{{#checkPermission "srp_dash_view_all"}}' +
                      '{{#ifNumCond 2 data.length}}'+
                      '{{LOADING}}'+
                      '<div class="result-load-more"><a class="s5 bt4 pull-left" href="#" data-size={{SIZE}} data-id="show-more">View more<span class="link-arrow-down"></span></a></div>'+
                    '{{/ifNumCond}}'+
                      '{{/checkPermission}}' +
                    '</div>'+
                    '</div>'+
                    '{{/checkPermission}}'+
                    '{{/ifNumCond}}'+
                    '{{/each}}',

        itemList: '{{#each. }}'+
                    '<div class="result-item padding-top-s padding-bottom-s card-vertical-separator-bottom">'+
                      '<div class="thumbnail result-item-cell">'+
                        '{{#ifEquals policyHolderGender "M"}}'+
                        '<svg class="icon-m hide-on-fallback" role="img" title="malepressed-prime1">'+
                          '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#malepressed-prime1"></use>'+
                          '<image class="icon-fallback" src="'+ path +'icons/malepressed-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                        '</svg>'+
                        '{{else}}'+
                        '<svg class="icon-m hide-on-fallback" role="img" title="icon-life-primary">'+
                          '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#femalepress-prime1"></use>'+
                          '<image class="icon-fallback" src="'+ path +'icons/femalepress-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                        '</svg>'+
                        '{{/ifEquals}}'+
                        '<div class="agent">'+
                          '<h5 class="title-text">{{{policyHolderName}}}</h5>'+
                          '<p class="bt4 b6">'+
                            '{{#each serviceRequest}}'+
                            '{{#ifEquals @index 0}}'+
                            '{{description}} '+
                            '{{/ifEquals}}'+
                            '{{/each}}'+
                            '{{#ifNumCond 1 serviceRequest.length }} (+{{math serviceRequest.length "-" 1}}) {{/ifNumCond}}'+
                            '</p>'+
                          '{{#ifEquals submitStatus "draft"}}'+
                            '<span class="status text-capitalize">Draft</p>'+
                          '{{/ifEquals}}'+
                            '{{#ifEquals submitStatus "pending"}}'+
                          '<span class="status status-error text-capitalize">Pending Authorisation</span>'+
                          '{{/ifEquals}}'+
                            '{{#ifEquals submitStatus "rejected"}}'+
                          '<span class="status status-error text-capitalize">Rejected by Customer</span>'+
                          '{{/ifEquals}}'+
                            '{{#ifEquals submitStatus "expired"}}'+
                          '<span class="status status-error text-capitalize">Expired</span>'+
                          '{{/ifEquals}}'+
                            '{{#ifEquals submitStatus "submitted"}}'+
                          '<span class="status status-good text-capitalize">Submitted for processing</span>'+
                          '{{/ifEquals}}'+
                        ' </div>'+
                      '</div>'+
                      '<div class="result-item-cell">'+
                        '{{#checkPermission "srp_dash_action_sr"}}'+
                          '<a class="agent title-day" href="{{linkPosRequest}}?sgServicePortalSubmitRef={{submitRef}}">'+
                            '<p class="bt4"> {{#getSubStatus }}{{submitStatus}}{{/getSubStatus}} on {{#formatDate}}{{lastUpdatedOn}}{{/formatDate}} </p>'+
                            '<svg class="icon-xs hide-on-fallback" role="img" title="arrow-2ndg">'+
                              '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#arrow-2ndg"></use>'+
                              '<image class="icon-fallback" alt="arrow-2ndg" src="'+ path +'icons/arrow-2ndg.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                            '</svg>'+
                          '</a>'+
                        '{{/checkPermission}}'+
                      '</div>'+
                    '</div>'+
                  '{{/each}}'
                };
    },

    loadData: function () {
      var that = this,
        optsClass = that.options.class,
        params = {
          sessionInfo: Site.getCookie('sessionInfo')
        }, checkPermission = false;

      Site.checkPermission('srp_dash_view_sr', function() {
        checkPermission = true;
        that.errorResultText.removeClass(optsClass.hidden).find('h6').html('YOU MAY HAVE NOT PERMISSION TO VIEW DASHBOARD.');
        
      });
      if(checkPermission) {
        return false;
      }
      that.loading.removeClass(optsClass.hidden);
      Site.ajaxUtil(
        that.options.url,
        that.options.method,
        'json',
        JSON.stringify(params),
        function(response) {
          if (response.total > 0) {
            var dataObject = response.data;
            $.each(dataObject, function(key, value) {
              value.linkFilter = that.options.link + '?status=' + key.split(' ')[0].toLowerCase();
            });
            that.vars.data = dataObject;
            var templateLoading = that.loading.addClass(optsClass.hidden).clone(),
                template = that.template.listWapper;
            template = template.replace('{{SIZE}}', '0')
                                .replace('{{SEEALLTEXT}}', that.element.data('see-all-text') || 'See All')
                                .replace('{{LOADING}}', templateLoading[0].outerHTML)
                                .replace('{{linkPosRequest}}', that.options.linkPos);

            var elemHtml = window.Handlebars.compile(template)(that.vars.data);
            that.element.append(elemHtml);
            that.loading.addClass(optsClass.hidden);
            that.element.off(events.click, '[data-id=see-all]').on(events.click, '[data-id=see-all]', function() {
              localStorage.removeItem('filterDashboard');
            });
          } else {
            that.noResultText.removeClass(optsClass.hidden);
            that.loading.addClass(optsClass.hidden);
          }
        },
        function(error, jqXHR) {
          if (jqXHR.status === '502') {
            that.errorResultText.html('<h6>Bad Gateway</h6>');
          } else {
            that.errorResultText.html('<h6>'+ error.message + '</h6>');
          }
          that.errorResultText.removeClass(optsClass.hidden);
          that.loading.addClass(optsClass.hidden);
        }
      );
    },

    showMore: function(thisElem) {
      var that = this,
          optsClass = this.options.class,
          status = thisElem.parents(optsClass.resultTable).siblings(optsClass.idStatus).data('status'),
          size = parseInt(thisElem.data('size')),
          data = [],
          start = size + that.vars.showDefault,
          end = start + that.vars.size;

      that.loading.removeClass(optsClass.hidden);
      $.each(that.vars.data[status].data, function(index, item) {

        if (index >= start && index < end) {
          data.push(item);
        }
      });

      thisElem.data('size', size + that.vars.size);

      that.vars.data[status].total <= end && thisElem.parent().addClass(optsClass.hidden);
      var template = that.template.itemList;
      template = template.replace('{{linkPosRequest}}', that.options.linkPos);
      var elemHtml = window.Handlebars.compile(template)(data);
      thisElem.parent().siblings('[data-id=loading-processing]').before(elemHtml);
      that.loading.addClass(optsClass.hidden);
    },

    destroy: function() {
      $.removeData(this.element[0], pluginName);
    }
  };
  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new LoadDashboard(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {
    class: {
      hidden: 'hidden',
      active: 'active',
      loading: '[data-id=loading-processing]',
      resultTable: '[data-id=result-table]',
      idStatus: '[data-id=status]',
      btnShowMore: '[data-id=show-more]'
    }
  };

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });

}(jQuery, window));

;(function($, window, undefined) {
  'use strict';
  var pluginName = 'load-information';
  var events = {
    click: 'click.'+ pluginName
  };
  function LoadInformation(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  LoadInformation.prototype = {
    init: function() {
      var that = this;
      that.initDom();
      that.LoadData();

      that.element
      .off(events.click, that.options.class.btnShowMore)
      .on(events.click, that.options.class.btnShowMore, function(e){

        e.preventDefault();
        var thisElem = $(this).parents(that.options.class.tabContent),
            type = thisElem.attr('id');
        that.renderHTMLItem(thisElem, type);
      });

      that.element
      .off(events.click, '[data-id=btnSubmitCustomer]')
      .on(events.click, '[data-id=btnSubmitCustomer]', function(e) {
        e.preventDefault();
        
        var customerElem = that.element.find('.customer-information'),
            obj = {};
        obj.customerId = customerElem.data('customer-id');
        obj.customerName = customerElem.data('customer-name');
        obj.customerGender = customerElem.data('customer-gender');
        obj.policyId = $(this).data('policy-id');
        obj.sourceSystem = $(this).data('source-system');
        that.sendFormCustomer(obj);
      });
    },

    initDom: function () {
      this.container = this.element.find('[data-id=data-container]');
      this.loading = this.element.find('[data-id=loading-processing]');
      this.errorResultText = this.element.find('[data-id=error-result]');

      this.template = {
          wrapper:   '<div class="thumbnail">' +
                      '{{#ifEquals customer.gender "M"}}' +
                      '<svg class="icon-m hide-on-fallback" role="img" title="malepressed-prime1">'+
                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="' + Site.vars.assetPath + 'icons/icons.svg#malepressed-prime1"></use>'+
                        '<image class="icon-fallback" src="' + Site.vars.assetPath + 'icons/malepressed-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">'+
                        '</image>'+
                      '</svg>' +
                      '{{else}}' +
                      '<svg class="icon-m hide-on-fallback" role="img" title="malepressed-prime1">'+
                        '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="' + Site.vars.assetPath + 'icons/icons.svg#femalepress-prime1">'+'</use>'+
                        '<image class="icon-fallback" src="' + Site.vars.assetPath + 'icons/femalepress-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="">'+'</image>'+
                      '</svg>' +
                      '{{/ifEquals}}' +
                    '</div>' +
                    '<div class="info-area">' +
                      '<div class="title">' +
                        '<h4>{{customer.fullNm}}</h4>' +
                      '</div>' +
                    '</div>' +
                    '<div class="information">' +
                    '{{#checkPermission "srp_cus_profile_pol_personal"}}' +
                    '<div class="customer-information"' +
                      'data-customer-id="{{customer.idNum}}"' +
                      'data-customer-name="{{customer.fullNm}}"' +
                      'data-customer-gender="{{customer.gender}}"' +
                    '>' +
                      '<div class="row">' +
                        '<div class="col-sm-4"><span class="bt8">Customer Number</span><span class="bt10">{{#if customer.idNum}}{{customer.idNum}}{{else}}-{{/if}}</span></div>' +
                        '<div class="col-sm-4"><span class="bt8">Date Of Birth</span><span class="bt10">{{#if customer.birthDt}}{{customer.birthDt}}{{else}}-{{/if}}</span></div>' +
                        '<div class="col-sm-4"><span class="bt8">Nationality</span><span class="bt10">{{#if customer.nationality}}{{customer.nationality}}{{else}}-{{/if}}</span></div>' +
                      '</div>' +
                    '</div>' +
                    '<div class="contact-information">' +
                      '<div class="row">' +
                        '<div class="col-sm-4"><span class="bt8">Home Number</span><span class="bt9">{{#if customer.phone.0.phoneNo}}{{customer.phone.0.phoneNo}}{{else}}-{{/if}}</span></div>' +
                        '<div class="col-sm-4"><span class="bt8">Mobile Number</span><span class="bt9">{{#if customer.phone.1.phoneNo}}{{customer.phone.1.phoneNo}}{{else}}-{{/if}}</span></div>' +
                        '<div class="col-sm-4"><span class="bt8">E-mail</span><span class="bt9">{{#if customer.email.0.emailAddress}}{{customer.email.0.emailAddress}}{{else}}-{{/if}}</span></div>' +
                      '</div>' +
                    '</div>' +
                    '{{/checkPermission}}' +
                    '{{#checkPermission "srp_cus_profile_pol_detail"}}' +
                      '<div class="policy" data-id="data-container">' +
                        '<h5 class="margin-bottom-xs">All policies<span class="count" data-id="count-result">({{totalPolicy}})</span></h5>' +
                        '{{#ifNumCond 0 totalPolicy}}' +
                        '<div class="padding-top-m padding-bottom-m">'+
                          '<ul class="nav-switch" role="tablist">'+
                            '{{#each policy}}'+
                            ' <li class="{{#ifEquals @index 0 }} active {{/ifEquals}}" role="presentation"><a class="h6 p3" href="#{{@key}}" title="{{@key}}" aria-controls="{{@key}}" role="tab" data-toggle="tab"><span>{{@key}}</span></a></li>'+
                            '{{/each}}'+
                          '</ul>'+
                          '<div class="tab-content">'+
                            '{{#each policy}}'+
                            '<div class="tab-pane fade {{#ifEquals @index 0 }} in active {{/ifEquals}}" id="{{@key}}" data-load role="tabpanel">'+
                              '{{#each this}}'+
                              '{{#ifNumCond @index '+ this.options.showDefault +'}}'+
                                '<div class="block card-6 card-border-top-grey">'+
                                  '<div class="thumbnail">'+
                                  '{{#if srcImg}}'+
                                    '<image class="icon-fallback" src="{{srcImg}}" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                                    '{{/if}}'+
                                  '</div>'+
                                  '<div class="content">'+
                                    '<div class="title margin-bottom-xs">'+
                                      '<h4>{{planName}}</h4>'+
                                      '<p class="description">'+
                                        '{{#if prodCategory}}'+
                                        '<span class="tag">{{prodCategory}}</span>'+
                                        '{{/if}}'+
                                      '</p>'+
                                    '</div>'+
                                    '{{#ifNumCond 0 rider.length}}'+
                                  '<div class="policy-riders">'+
                                    '<div class="card-vertical-separator-top padding-top-m padding-bottom-m">'+
                                        '<div class="policy-rider-title">'+
                                        '{{#rider}}'+
                                          '{{#ifNumCond @index 1}}'+
                                          '<span class="policy-rider-title-text h5">{{riderName}}</span>'+
                                          '{{/ifNumCond}}'+
                                        '{{/rider}}'+
                                        '{{#ifNumCond 1 rider.length}}'+
                                          '<span class="lk1" href="#" title="{{math rider.length "-" 1}} more addons">{{math rider.length "-" 1}} more addons</span>' +
                                          '{{/ifNumCond}}'+
                                      '</div>'+
                                    '</div>'+
                                  '</div>'+
                                    '{{/ifNumCond}}'+
                                    '<div class="card-vertical-separator-top">'+
                                      '<div class="policy-details margin-bottom-xxs margin-top-xxs">'+
                                      '<p>Policy Number:<span class="number"><strong data-policy-number="{{polNum}}" >{{polNum}}</strong></span></p>'+
                                  '<p>Premium Status:<span class="number"><strong>{{#if premiumStatusDesc}}{{premiumStatusDesc}}{{else}}-{{/if}}</strong></span></p>'+
                                      '<p>Covers:<span class="number">'+
                                      '<strong>{{#participantList participant "LF"}}{{/participantList}}'+
                                      '</strong>'+
                                      '</span></p>'+
                                      '</div>'+
                                      '{{#checkPermission "srp_cus_profile_action_sr"}}' +
                                      '<div class="submission">'+
                                      '{{#ifEqualAgentNum servicingAgent}}' +
                                        '<button data-id="btnSubmitCustomer" class="btn btn-default btn-secondary"'+
                                          'data-source-system="{{sourceSystem}}"' +
                                          'data-policy-id="{{polNum}}"'+
                                        ' type="submit">Submit Pos Request</button>'+

                                      '{{else}}' + 
                                        '{{#ifEqualAgentClass}}'+
                                          
                                          '<button data-id="btnSubmitCustomer" class="btn btn-default btn-secondary"'+
                                          'data-source-system="{{sourceSystem}}"' +
                                          'data-policy-id="{{polNum}}"'+
                                        ' type="submit">Submit Pos Request</button>'+
                                        
                                        '{{/ifEqualAgentClass}}'+
                                      '{{/ifEqualAgentNum}}' +
                                      '</div>'+
                                      '{{/checkPermission}}' +
                                    '</div>'+
                                  '</div>'+
                                '</div>'+
                              '{{/ifNumCond}}'+
                              '{{/each}}'+
                              '{{#ifNumCond '+ this.options.showDefault +' this.length }}'+
                              '<div class="show-more" data-id="show-more"><a class="lk1 load-info" href="#" title="Show more"><span>Show more</span>'+
                              '<svg class="icon-s icon-32  hide-on-fallback" role="img" title="accarrowdn-glyph">'+
                                '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ Site.vars.assetPath +'icons/icons.svg#accarrowdn-glyph"></use>'+
                                '<image class="icon-fallback" alt="accarrowdn-glyph" src="' + Site.vars.assetPath +'icons/accarrowdn-glyph.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                                '</svg></a></div>'+
                                '{{/ifNumCond}}'+
                              '</div>'+
                            '{{/each}}'+
                          '</div>' +
                        '</div>' +
                        '{{/ifNumCond}}'+
                      '</div>' +
                    
                    '{{/checkPermission}}' +
                  '</div>',

        listItem: '{{#each .}}'+
                     '<div class="block card-6 card-border-top-grey">'+
                        '<div class="thumbnail">'+
                        '{{#if srcImg}}'+
                        '<image class="icon-fallback" src="{{srcImg}}" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                        '{{/if}}'+
                        '</div>'+
                        '<div class="content">'+
                          '<div class="title margin-bottom-xs">'+
                            '<h4>{{planName}}</h4>'+
                            '<p class="description">'+
                              '{{#if prodCategory}}'+
                              '<span class="tag">{{prodCategory}}</span>'+
                              '{{/if}}'+
                            '</p>'+
                          '</div>'+
                         '<div class="policy-riders">'+
                           '<div class="card-vertical-separator-top padding-top-m padding-bottom-m">'+
                              '<div class="policy-rider-title">'+
                              '{{#rider}}'+
                                '{{#ifNumCond @index 1}}'+
                                '<span class="policy-rider-title-text h5">{{riderName}}</span>'+
                                '{{/ifNumCond}}'+
                               '{{/rider}}'+
                               '{{#ifNumCond 1 rider.length}}'+
                                '<span class="lk1" href="#" title="{{math rider.length "-" 1}} more addons">{{math rider.length "-" 1}} more addons</span>'+
                                '{{/ifNumCond}}'+
                             '</div>'+
                           '</div>'+
                         '</div>'+
                          '<div class="card-vertical-separator-top">'+
                            '<div class="policy-details margin-bottom-xxs margin-top-xxs">'+
                            '<p>Policy Number:<span class="number"><strong>{{polNum}}</strong></span></p>'+
                                '<p>Premium Status:<span class="number"><strong>{{#if premiumStatusDesc}}{{premiumStatusDesc}}{{else}}-{{/if}}</strong></span></p>'+
                            '<p>Covers:<span class="number">'+
                             '<strong>{{#participantList participant "LF"}}{{/participantList}}'+
                             '</strong>'+
                             '</span></p>'+
                            '</div>'+
                            '{{#checkPermission "srp_cus_profile_action_sr"}}' +
                            '<div class="submission">'+
                              '{{#ifEqualAgentNum servicingAgent}}' +
                                '<button data-id="btnSubmitCustomer" class="btn btn-default btn-secondary"'+
                                  'data-source-system="{{sourceSystem}}"' +
                                  'data-policy-id="{{polNum}}"'+
                                ' type="submit">Submit Pos Request</button>'+
                              '{{else}}' + 
                              '{{#ifEqualAgentClass}}'+
                                '<button data-id="btnSubmitCustomer" class="btn btn-default btn-secondary"'+
                                'data-source-system="{{sourceSystem}}"' +
                                'data-policy-id="{{polNum}}"'+
                              ' type="submit">Submit Pos Request</button>'+
                              '{{/ifEqualAgentClass}}'+
                            '{{/ifEqualAgentNum}}' +
                            '</div>'+
                            '{{/checkPermission}}' +
                          '</div>'+
                        '</div>'+
                      '</div>'+
                  '{{/each}}'
                };
    },
    LoadData: function () {
      var that = this,
          optsClass = that.options.class,
          params = {
            idNum: that.element.data('customer-id'),
          };
      var permissionDetail = Site.getPermission('srp_cus_profile_pol_detail'),
          permissionPersonal = Site.getPermission('srp_cus_profile_pol_personal');
      permissionDetail && permissionDetail.securityLevel === '00' &&
      permissionPersonal && permissionPersonal.securityLevel === '00' &&
      (window.location = $('#async-script').data('forbidden-path'));

      if (that.element.data('customer-id')) {
        that.loading.removeClass(optsClass.hidden);
        Site.ajaxUtil(
          that.options.ajax,
          that.options.method,
          'json',
          JSON.stringify(params),
          function(response) {
            if(response.statusCode !== 200) {
              that.errorResultText.removeClass(optsClass.hidden).find('h6').text(response.message);
              that.loading.addClass(optsClass.hidden);
              return false;
            }

            if(response.data.customer) {
              if(!window._.isEmpty(window.policyIcons)) {
                $.each(response.data.policy, function(key, value) {
                  $.each(value, function(index, item) {
                    var specialCategory = 'TRAVEL AND LIFESTYLE',
                      specialPlanName = 'AIA VITALITY',
                      srcImg = window.policyIcons[item.prodCategory.toUpperCase()] || '',
                      isSpecial = (item.prodCategory.toUpperCase() === specialCategory && item.planName.toUpperCase() === specialPlanName);

                    isSpecial && (srcImg = window.policyIcons[specialPlanName]);
                    !srcImg && (srcImg = window.policyIcons[Object.keys(window.policyIcons)[0]]); 

                    item.srcImg = srcImg;
                  });
                });
                that.renderHTML(response);
              }
              that.objectData = response.data.policy;
            } else {
              $('#async-script').data('cq-mode') !== 'edit' && window.location.replace($('#async-script').data('404-path'));
            }
            that.loading.addClass(optsClass.hidden);
          },
          function(error) {
            that.errorResultText.removeClass(optsClass.hidden).find('h6').text(error.message);
            that.loading.addClass(optsClass.hidden);
            throw error;
          }
        );
      } else {
        $('#async-script').data('cq-mode') !== 'edit' && window.location.replace($('#async-script').data('404-path'));
      }
    },
    renderHTML: function (response) {
      (response.data.totalPolicy && response.data.totalPolicy > 0 ) &&
        $.each(response.data.policy, function(key, value) {
          if (!value.length) {
            delete response.data.policy[key];
          } else {
            $.each(value, function(indexPol, itemPol){
              var riderArray = [];
              itemPol.rider.length &&
              $.each(itemPol.rider, function(indexRider, itemRider){
                if(!itemRider.dummyInd || itemRider.dummyInd !== 'Y') {
                  riderArray.push(itemRider);
                }
              });
              itemPol.rider = riderArray;
            });
          }
        });
      
      var elemHtml = window.Handlebars.compile(this.template.wrapper)(response.data);
      this.container.prepend(elemHtml);
      this.loading.addClass(this.options.class.hidden);
    },

    renderHTMLItem: function (thisElem, type) {
      var that = this,
          optsClass = that.options.class,
          data = [];
      $.each(that.objectData[type], function(index, item) {
        if(index >= parseInt(that.options.showDefault)){
          var riderArray = [];
          item.rider.length &&
          $.each(item.rider, function(indexRider, itemRider){
            if(!itemRider.dummyInd || itemRider.dummyInd !== 'Y') {
              riderArray.push(itemRider);
            }
          });
          item.rider = riderArray;
          data.push(item);
        }
      });

      var elemHtml = window.Handlebars.compile(that.template.listItem)(data);
      thisElem.append(elemHtml);
      thisElem.find(optsClass.btnShowMore).addClass(optsClass.hidden);
    },

    sendFormCustomer: function(obj) {
      var that = this,
          params = {
            customerId: obj.customerId,
            customerName: obj.customerName,
            customerGender: obj.customerGender,
            policyId: obj.policyId,
            sourceSystem: obj.sourceSystem
          };
      Site.ajaxUtil(
        that.options.urlSubmitPos,
        that.options.method,
        'json',
        JSON.stringify(params),
        function(response) {
          if (response.statusCode === 200) {
            window.location.href = that.options.urlRedirectPage + '?sgServicePortalSubmitRef=' + response.submitRef;
          }
        },
        function(error) {
          throw error;
        }
      );
    },

    destroy: function() {
      $.removeData(this.element[0], pluginName);
    }
  };
  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new LoadInformation(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {
    class: {
      hidden: 'hidden',
      active: 'active',
      tabContent: '.tab-pane',
      btnShowMore: '[data-id=show-more]'
    },
    showDefault:3
  };

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });
}(jQuery, window));

;(function($, window, undefined) {
  'use strict';

  var pluginName = 'login-handle';

  function LoginHandle(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  LoginHandle.prototype = {
    init: function() {
      var that = this;
      that.messageError = that.element.find('#login-error');

      that.element.submit( function(e){
        e.preventDefault();
        that.loginRequest();
      });
    },

    loginRequest: function(){
      var that = this,
          params = Site.serializeObject(that.element.serializeArray());

      $.ajax({
        url: that.element.attr('action'),
        type: that.element.attr('method'),
        data: Site.encryptedData(JSON.stringify(params)),
        dataType:'json',
        contentType: 'application/json',
        success: function(response) {
          that.messageError.text('');
          if (response.statusCode === 200) {
            var params = {
              statusCode: response.statusCode,
              jSessionId: response.data.jSessionId,
              sessionInfo: response.data.sessionInfo,
              jwtToken: response.data.jwtToken
            };

            response.data.uamResponse && localStorage.setItem('userPermission', response.data.uamResponse);
            that.loginResponse(params);

          } else {
            that.messageError.text(response.message);
          }
        },
        error: function(error) {
          that.messageError.text(error.message);
          throw error;
        }
      });
    },

    loginResponse: function(params){
      var that = this;

      $.ajax({
        url: that.element.data('url-aem'),
        type: that.element.attr('method'),
        data: JSON.stringify(params),
        dataType:'json',
        contentType: 'application/json',
        success: function(response) {
          response.url && window.location.replace(response.url);
        },
        error: function(error) {
          that.messageError = error;
        }
      });
    },

    destroy: function() {
      $.removeData(this.element[0], pluginName);
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new LoginHandle(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {
    defaultPath: '/searchtest.html'
  };

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });

}(jQuery, window));

;(function($, window, undefined) {
  'use strict';

  var pluginName = 'login-sso';

  var serializeObject = function(serializeArray) {
    var newArray = {};
    for (var i = 0; i < serializeArray.length; i++) {
      newArray[serializeArray[i]['name']] = serializeArray[i]['value'];
    }
    return newArray;
  };

  function LoginSso(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  LoginSso.prototype = {
    init: function() {
      this.checkingToken();
    },

    checkingToken: function() {
      var that = this,
          elem = that.element,
          opts = that.options,
          params, formData;

      elem.submit(function(e) {
        e.preventDefault();
        formData = serializeObject(elem.serializeArray());
        params = $.extend({}, formData);
        params.handOffAppId = formData.handOffAppId === 'LMSADMINAPP' ? 'INTERNALACCESSAPP' : 'AGENTACCESSAPP';
        $.ajax({
          url: opts.serviceUrl,
          method: 'POST',
          data: JSON.stringify(params),
          dataType: 'json',
          contentType: 'application/json',
          success: function(response) {
            that.sendToken($.extend({}, response, { handOffAppId: formData.handOffAppId }));
          },
          error: function(error) {
            throw error;
          }
        });
      });
    },

    sendToken: function(obj) {
      var that = this;
      $.ajax({
        url: this.options.loginSsoUrl,
        method: 'POST',
        data: JSON.stringify({
          ssoToken: obj.otp,
          handOffAppId: obj.handOffAppId
        }),
        dataType: 'json',
        contentType: 'application/json',
        success: function(response) {
          var params = {};
          if (response.statusCode === 200) {
            params = {
              statusCode: response.statusCode,
              jSessionId: response.data.jSessionId,
              sessionInfo: response.data.sessionInfo,
              jwtToken: response.data.jwtToken
            };
            response.data.uamResponse && localStorage.setItem('userPermission', response.data.uamResponse);
          } else if (response.statusCode === 509 || response.statusCode === 510) {
            !that.element.find('.error-sso').length &&
            that.element.append('<p class="u2 error-sso">'+ response.message +'</p>');
          } else {
            params = response;
          }
          response.statusCode !== 509 && 
          that.loginResponse(params);
        },
        error: function(error) { throw error; }
      });
    },

    loginResponse: function(response) {
      if (response.data) {
        $.each(response.data, function(key, value) {
          $('<input type="hidden" name="' + key + '"/>').val(value).appendTo('#login-sso');
        });
        $('<input type="hidden" name="statusCode' + '"/>').val(response.statusCode).appendTo('#login-sso');
        $('<input type="hidden" name="isDemoSso' + '"/>').val('true').appendTo('#login-sso');
      } else {
        $.each(response, function(key, value) {
          $('<input type="hidden" name="' + key + '"/>').val(value).appendTo('#login-sso');
        });
        $('<input type="hidden" name="isDemoSso' + '"/>').val('true').appendTo('#login-sso');
      }
      $('#login-sso').submit();
    },

    destroy: function() {
      $.removeData(this.element[0], pluginName);
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new LoginSso(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {};

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });

}(jQuery, window));

;(function($, window, undefined) {
  'use strict';

  var pluginName = 'logout-request';
  var idleTime = 0;
  var logoutBy = '';
  var idleTimeCount;
  var events = {
    click: 'click.' + pluginName,
  };

  function Logout(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  Logout.prototype = {
    init: function() {
      if (window.location.pathname === this.options.loginPath) {
        this.element.find('[data-id=search-btn], [data-id=signout-btn]').addClass('hidden');
      } else {
        this.idleLogout();
        this.confirmLogout();
      }
    },

    idleLogout: function() {
      var that = this,
          opts = that.options,
          idleModal = $('[data-id=idle-logout-modal]');

      var startInterval = function() {
        idleTimeCount = setInterval(function() {
          idleTime++;
          if (idleTime >= opts.idle) {
            idleModal.modal('show');
            clearInterval(idleTimeCount);
            var confirmLogout = setTimeout(function() {
                logoutBy = 'SYS';
                idleModal.hide();
                $('.modal-backdrop').remove();
                var isSaveDraft = $(this).hasClass('save-draft');
                isSaveDraft &&
                $('[data-add-services]')['add-services']('saveAsDraftAction', function (){
                  that.logoutRequest();
                });
                !isSaveDraft && that.logoutRequest();
              }, opts.logoutAfter * 60000);
            idleModal.on('hidden.bs.modal', function() {
              clearTimeout(confirmLogout);
              clearInterval(idleTimeCount);
              startInterval();
            });
          }
        }, opts.countTime * 60000);
      };

      startInterval();
      Site.vars.docElem.on('mousemove click keydown', function() {
        if (idleTime) {
          idleTime = 0;
        }
      });
    },

    confirmLogout: function() {
      var that = this;
      $('[data-id=logout-btn]')
        .off(events.click)
        .on(events.click, function() {
          logoutBy = 'USER';
          var isSaveDraft = $(this).hasClass('save-draft');
          isSaveDraft &&
          $('[data-add-services]')['add-services']('saveAsDraftAction', function (){
            that.logoutRequest();
          });
         !isSaveDraft && that.logoutRequest();
        });
    },
    logoutRequest: function() {
      var that = this,
          opts = that.options,
          serviceURL = opts.logoutApi,
          confirmLogoutModal = $('[data-id=logout-confirm-modal]');
      var params = {
        logoutBy : logoutBy
      };
      Site.ajaxUtil(
        serviceURL,
        'POST',
        'json',
        JSON.stringify(params),
        function(data, textStatus, xhr) {
          var loginType = Site.getSessionInfo().loginType;
          if (xhr.status === 200) {
            $.ajax({
              url: that.options.logoutServlet,
              method: 'POST',
              data: JSON.stringify({statusCode: xhr.status.toString()}),
              dataType: 'json',
              contentType: 'application/json',
              success: function(data, textStatus, xhr) {
                if (xhr.status === 200) {
                  localStorage.removeItem('userPermission');
                  localStorage.removeItem('filterDashboard');
                  clearInterval(idleTimeCount);
                  confirmLogoutModal.modal('show');
                  confirmLogoutModal.on('hidden.bs.modal', function() {
                    Site.vars.winElem.unbind('beforeunload');
                    Site.redirectLogoutRequest(loginType);
                  });
                }
              },
              error: function(error) { throw error; }
            });
          }
        },
        function(error) {
          throw error;
        }
      );
    },

    destroy: function() {
      $.removeData(this.element[0], pluginName);
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new Logout(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {
    logoutUrl: '/bin/logout',
    loginPath: '/login.html',
    idle: 15,
    countTime: 1,
    logoutAfter: 3
  };

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });

}(jQuery, window));

;(function($, window, undefined) {
  'use strict';

  var pluginName = 'search-global',
      event = {
      click: 'click.' + pluginName,
      keyup: 'keyup.' + pluginName,
      mouseup: 'mouseup.' + pluginName
    },
    path = Site.vars.assetPath;
  function Plugin(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  Plugin.prototype = {
    init: function() {
      var that = this,
          opts = that.options,
          optsClass = opts.class;

      that.initDOM();
      that.vars = {
        stringPolicy: 'policy',
        stringCustomer: 'customer',
        stringNational: 'national',
        url: that.formSearch.attr('action'),
        method: that.formSearch.attr('method'),
        size: parseInt(that.formSearch.data('size')),
        maxSize: parseInt(that.formSearch.data('max-size')),
        currentPage: parseInt(that.formSearch.data('page')),
        checkSearchTypeCustomer: false,
        checkSearchTypePolicy: false,
      };

      // show hide wildcard for FSC
      Site.getSessionInfo().userType !== 'FSC' && that.searchTypeFsc.remove();

      Site.checkPermission('srp_global_search', function() {
        window.location = $('#async-script').data('forbidden-path');
      });

      that.searchBar
      .off(event.keyup)
      .on(event.keyup , this.onKeyUpSearchBar.bind(this));

      that.searchInput
      .off(event.keyup)
      .on(event.keyup, function(e) {
        e.preventDefault();
        that.didKeySuggestion(e);
      });

      $(Site.vars.docElem)
      .off(event.mouseup)
      .on(event.mouseup, function(e) {
        if (!that.formSearch.is(e.target) &&
            that.formSearch.has(e.target).length === 0) {
          that.hideSuggestList(e);
        }
      });

      // click dropdown
      that.searchSuggestListItems.find('a')
      .off(event.click)
      .on(event.click, function(e) {
        var self = $(this);
        e.preventDefault();
        that.hideSuggestList(e);
        // get type
        var type = self.data('type');

        self.parent().addClass(optsClass.active)
            .siblings().removeClass(optsClass.active);
        // get search type
        that.vars.searchType = self.data('search-type');
        that.tabNav.removeClass(optsClass.hidden);
        that.vars.currentType = type;
        that.tabNavItem.removeClass(optsClass.active).addClass('hidden');
        if (type === that.vars.stringPolicy) {
          that.tabPolicy.parent().addClass(optsClass.active).removeClass('hidden');
        } else {
          that.tabCustomer.parent().addClass(optsClass.active).removeClass('hidden');
        }
        that.vars.checkSearchTypeCustomer = false;
        that.vars.checkSearchTypePolicy = false;
        that.showTabContent(type);
        that.loadDataSearch(type);
      });

      // click tab
      this.tabNavItem.find('[data-toggle=tab]')
      .off(event.click)
      .on(event.click, function(e) {
        e.preventDefault();

        that.hideSuggestList();
        var self = $(this),
            type = self.data('type');
        if (type === that.vars.stringPolicy) {
          type = that.vars.stringPolicy;
        } else {
          type = that.searchSuggestList.find('li.active').find('a').data('type');
          if (type ===  that.vars.stringPolicy) {
            type = that.vars.stringCustomer;
          }
        }
        if (that.vars.currentType === type || that.searchInput.val().length < 3) {
          e.stopPropagation();
          that.searchInput.focus();
          return;
        }

        self.addClass(optsClass.active);
        that.vars.currentType = type;

        that.showTabContent(type);
        if ((!that.vars.checkSearchTypeCustomer && type !== that.vars.stringPolicy) ||
        (!that.vars.checkSearchTypePolicy && type === that.vars.stringPolicy)) {
          that.loadDataSearch(type);
        }
      });

      that.btnShowMore
      .off(event.click)
      .on(event.click, function(e) {
        e.preventDefault();
        that.hideSuggestList();
        that.loadMoreContent(that.vars.currentType);
      });

      that.formSearch.submit(function(e) {
        e.preventDefault();
      });

      that.element
      .off(event.click, '[data-id=btnSubmitCustomer]')
      .on(event.click, '[data-id=btnSubmitCustomer]', function(e) {
        e.preventDefault();
        var self = $(this),
            obj = {};
        obj.customerId = self.data('customer-id');
        obj.customerName = self.data('customer-name');
        obj.customerGender = self.data('customer-gender');
        that.sendFormCustomer(obj);
      });

      that.element
      .off(event.click, '[data-id=btnSubmitPolicy]')
      .on(event.click, '[data-id=btnSubmitPolicy]', function(e) {
        e.preventDefault();
        var self = $(this),
            obj = {};
        obj.customerId = self.data('customer-id');
        obj.customerName = self.data('customer-name');
        obj.customerGender = self.data('customer-gender');
        obj.policyId = self.data('policy-id');
        obj.sourceSystem = self.data('source-system');
        that.sendFormPolicy(obj);
      });
    },

    initDOM: function () {
      this.searchBar = this.element.find('[data-id=inline-searchbar]');
      this.formSearch = this.searchBar.find('form');
      this.blockSearchType = this.searchBar.find('.search-type');
      this.searchType = this.formSearch.find('input[name=search-type]');
      this.searchInput = this.formSearch.find('[name=value]');
      this.searchSuggestList = this.searchBar.find('[data-id=search-suggest]');
      this.searchSuggestListItems = this.searchSuggestList.find('li');
      this.searchTypeFsc = this.searchSuggestList.find('[data-id=search-type-fsc]');
      this.searchSuggestListFsc = this.searchBar.find('[data-id=search-suggest-fsc]');
      this.tabNav = this.element.find('[data-id=tab-nav]');
      this.tabNavItem = this.tabNav.find('li');
      this.tabPolicy = this.tabNavItem.find('[data-type=policy]');
      this.tabCustomer = this.tabNavItem.find('[data-type=customer]');
      this.tabResult = this.element.find('[data-id=tab-content]');

      this.contentCustomer = this.tabResult.find('[data-id=content-customer]');
      this.contentPolicy = this.tabResult.find('[data-id=content-policy]');
      this.btnShowMore = this.element.find('[data-id=show-more]');
      this.loading = this.element.find('[data-id=loading-processing-bar]');
      this.template = {
        customer: '<script type="text/x-handlebars-template">'+
                    '{{#each .}}'+
                      '<div class="result-item padding-top-s padding-bottom-s card-vertical-separator-bottom">'+
                          '<div class="thumbnail result-item-cell">'+
                            '{{#ifEquals gender "M"}}'+
                            '<svg class="icon-m hide-on-fallback" role="img" title="malepressed-prime1">'+
                              '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#malepressed-prime1"></use>'+
                              '<image class="icon-fallback" src="'+ path +'icons/malepressed-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                            '</svg>'+
                            '{{/ifEquals}}'+
                            '{{#ifEquals gender "F"}}'+
                            '<svg class="icon-m hide-on-fallback" role="img" title="icon-life-primary">'+
                              '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#femalepress-prime1"></use>'+
                              '<image class="icon-fallback" src="'+ path +'icons/femalepress-prime1.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image>'+
                            '</svg>'+
                            '{{/ifEquals}}'+
                            '<div class="agent">'+
                              '{{#ifEquals role "OW"}}'+
                              '<a class="h5 title-text" href="{{Link}}{{clientNum}}">{{fullNm}}</a>'+
                              '{{else}}'+
                              '<p class="h5 title-text">{{fullNm}}</p>'+
                              '{{/ifEquals}}'+
                              '<p class="bt4">{{idNum}}</p>'+
                              '{{#if birthDt}}'+
                                '<p class="bt4">{{CustomerDateText}} {{birthDt}}</p>'+
                              '{{/if}}'+
                            '</div>'+
                          '</div>'+
                          '<div class="result-item-cell">'+
                            '{{#checkPermission "srp_cus_profile_action_sr"}}' +
                              '{{#ifEquals role "OW"}}'+
                                '<button data-id="btnSubmitCustomer"'+
                                'data-customer-id="{{idNum}}"' +
                                'data-customer-name="{{fullNm}}"' +
                                'data-customer-gender="{{gender}}"' +
                                'class="submit-pos link-pos btn btn-default btn-secondary" type="button">{{SubmitRequest}}</button>'+
                              '{{/ifEquals}}'+
                            '{{/checkPermission}}' +
                          '</div>'+
                        '</div>'+
                      '{{/each}}'+
                    '</script>',

        policy: '<script type="text/x-handlebars-template">'+
                '{{#each .}}'+
                  '<div class="result-item result-item-style1 padding-top-s padding-bottom-s card-vertical-separator-bottom">'+
                    '<div class="result-item-cell">'+
                      '<div class="agent">'+
                        '<h5 class="h5 title-text">{{polNum}}</h5>'+
                        '<p class="bt4">{{planName}}</p>'+
                      '</div>'+
                    '</div>'+
                    '<div class="thumbnail result-item-cell">'+
                      '<div class="agent">'+
                      '<p class="bt4">{{PolicyOwnerText}}</p>'+
                      '{{#each participant}}'+
                        '{{#ifEquals @index 0}}'+
                          '<p class="h5 title-text">{{fullNm}}</p>'+
                        '{{/ifEquals}}'+
                        '{{#ifEquals @index 1}}'+
                          '<p class="bt4">{{fullNm}} {{countParticipant}} </p>'+
                        '{{/ifEquals}}'+
                       '{{/each}} '+
                      '</div>'+
                    '</div>'+
                    '<div class="result-item-cell">'+
                      '{{#checkPermission "srp_cus_profile_action_sr"}}' +
                        '{{#ifEqualAgentNum servicingAgent}}' +
                        '<button class="submit-pos link-pos btn btn-default btn-secondary"' +
                          '{{#each participant}}'+
                            '{{#ifEquals role "OW"}}'+
                              'data-id="btnSubmitPolicy"'+
                              'data-customer-id="{{idNum}}"' +
                              'data-customer-name="{{fullNm}}"' +
                              'data-customer-gender="{{gender}}"' +
                            '{{/ifEquals}}'+
                          '{{/each}} '+
                        'data-policy-id="{{polNum}}"' +
                        'data-source-system="{{sourceSystem}}"' +
                         'type="button">{{SubmitRequest}}</button>'+
                        '{{else}}'+
                         '{{#ifEqualAgentClass}}'+
                         '<button class="submit-pos link-pos btn btn-default btn-secondary"' +
                          '{{#each participant}}'+
                            '{{#ifEquals role "OW"}}'+
                              'data-id="btnSubmitPolicy"'+
                              'data-customer-id="{{idNum}}"' +
                              'data-customer-name="{{fullNm}}"' +
                              'data-customer-gender="{{gender}}"' +
                            '{{/ifEquals}}'+
                          '{{/each}} '+
                          'data-policy-id="{{polNum}}"' +
                          'data-source-system="{{sourceSystem}}"' +
                          'type="button">{{SubmitRequest}}</button>'+
                          '{{/ifEqualAgentClass}}'+
                        '{{/ifEqualAgentNum}}' +
                      '{{/checkPermission}}'+
                    '</div>'+
                  '</div>'+
                '{{/each}}'+
              '</script>'
      };
    },

    onKeyUpSearchBar: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var  optsClass = this.options.class,
           isActive = this.searchBar.hasClass(optsClass.open);
      if (!/(38|40|27|32)/.test(e.which) || !isActive || !this.searchSuggestListItems.length) {
        return;
      }
      if (e.which === 27) {
        this.searchBar.removeClass(optsClass.open);
        this.searchSuggestList.hide();
      }
    },

    didKeySuggestion: function(e) {

      if (/(38|40|27)/.test(e.which)) {
        return;
      }

      var val = this.searchInput.val().trim(),
          optsClass = this.options.class;

      if (val.length > 2 && /(13)/.test(e.which)) {
        this.searchSuggestListItems.each(function () {
          var elem = $(this).find('span'),
              title = elem.data('title') + ' ' + val;
          elem.text(title);
        });
        this.searchBar.addClass(optsClass.open);
        this.searchSuggestList.show();
      } else {
        this.searchBar.removeClass(optsClass.open);
        this.searchSuggestList.hide();
      }
    },

    hideSuggestList: function() {
      this.searchBar.removeClass(this.options.open);
      this.searchSuggestList.hide();
    },

    showTabContent: function(type) {
      var that = this,
          optsClass = that.options.class;
      if (type === that.vars.stringPolicy) {
        that.contentPolicy.removeClass(optsClass.hidden);
        that.contentCustomer.addClass(optsClass.hidden);
      } else {
        that.contentPolicy.addClass(optsClass.hidden);
        that.contentCustomer.removeClass(optsClass.hidden);
      }
    },

    loadDataSearch: function(type) {
      var that = this,
          optsClass = that.options.class,
          value = that.searchInput.val().trim().toString(),
          url = that.vars.url,
          blockContent = type === that.vars.stringPolicy ? that.contentPolicy : that.contentCustomer,
          blockResult = blockContent.find('.result-table'),
          btnShowMore = blockContent.find('[data-id=show-more]'),
          countResult = blockContent.find('.count-result'),
          params = {
            searchType: that.vars.searchType || 'exact'
          };
          switch (type) {
            case that.vars.stringCustomer:
              params.name = value;
              params.idNum = '';
              break;
            case that.vars.stringNational:
              params.name = '';
              params.idNum = value;
              break;
            default:
              params.polNum = value;
              break;
          }
      that.showLoading(countResult);
      blockResult.addClass(optsClass.hidden);
      btnShowMore.addClass(optsClass.hidden);
      countResult.addClass(optsClass.hidden);
      if (type === that.vars.stringPolicy) {
        url = this.tabPolicy.data('url'),
        that.vars.checkSearchTypePolicy = true;
      } else {
        that.vars.checkSearchTypeCustomer = true;
      }
      Site.ajaxUtil(
        url,
        that.vars.method,
        'json',
        JSON.stringify(params),
        function(response) {
          if (response.data) {
            var dataResponse = response;
            if (type === that.vars.stringPolicy) {
              that.vars.dataPolicy = dataResponse;
              $.each(dataResponse.data, function (index, item) {
                $.each(item.participant, function (index, itemParticipant) {
                  item.participant.length - 2 > 0 &&
                  (itemParticipant.countParticipant = '(+' +  (item.participant.length - 2) + ')');
                });
              });
            } else {
              that.vars.dataCustomer = dataResponse;
            }
            that.renderDataSearch(dataResponse, type);
            that.hideLoading();
          } else {
            that.callAjaxFail(blockContent);
          }
        },
        function(error, jqXHR) {
          var elemError = blockContent.find('[data-id=error-result]');
          if (jqXHR.status === '502') {
            elemError.html('<h6>Bad Gateway</h6>');
          } else {
            elemError.html('<h6>'+ error.message + '</h6>');
          }
          elemError.removeClass(that.options.class.hidden);
          that.loading.addClass(that.options.class.hidden);
        }
      );
    },

    renderDataSearch: function(response, type) {
      var that = this,
          opts = that.options,
          optsClass = opts.class,
          total,
          blockContent = (type === that.vars.stringPolicy) ? that.contentPolicy : that.contentCustomer,
          blockResult = blockContent.find('.result-table'),
          btnShowMore = blockContent.find('[data-id=show-more]'),
          countResult = blockContent.find('[data-id=count-result]'),
          notifyResult = blockContent.find('[data-id=notify-max-result]'),
          noResult = blockContent.find('[data-id=no-result]'),
          itemElem;
      if (type === that.vars.stringPolicy) {
        total = that.vars.dataPolicy ? that.vars.dataPolicy.total : 0;
      } else {
        total = that.vars.dataCustomer ? that.vars.dataCustomer.total : 0;
      }

      // render data
      if (total > 0) {
        itemElem = that.renderDataContent(response, type, 0, that.vars.size);

        blockResult.removeClass(optsClass.hidden).html(itemElem);
        // hide show showmore
        var isShowBtnShowMore = response.data.length > blockResult.children().length;

        isShowBtnShowMore && btnShowMore.removeClass(optsClass.hidden);
        !isShowBtnShowMore && btnShowMore.addClass(optsClass.hidden);
      }

      // notify
      var value = that.searchInput.val().trim() !== '' ? '\''+ that.searchInput.val().trim() + '\'' : '',
          textResult = '',
          textType = type === that.vars.stringPolicy ? type + ' number' : type;

      if (total) {
        noResult.addClass(optsClass.hidden);
        countResult.removeClass(optsClass.hidden);
        total > that.vars.maxSize && notifyResult.removeClass(optsClass.hidden);
        // countResult html
        if (type === that.vars.stringNational) {
          textResult = this.tabResult.find('[data-id=template-'+type+']').html();
        } else {
          textResult = this.tabResult.find('[data-id=template-global]').html();
        }

        total > 1 && type === that.vars.stringPolicy && (textType = type + ' number(s)');
        total > 1 && type !== that.vars.stringPolicy && (textType = type + '(s)');

        textResult = textResult.replace('{{TOTAL}}', '<strong>'+ total + '</strong>')
                                .replace('{{SEARCHTEXT}}', '<strong class="searchText"></strong>')
                                .replace('{{TYPE}}', textType );
        countResult.html(textResult);
        countResult.find('.searchText').text(that.escapeXssCharacter(value));

      } else {
        countResult.addClass(optsClass.hidden);
        noResult.removeClass(optsClass.hidden);
        // noResult html
        if (type === that.vars.stringNational) {
          textResult = this.tabResult.find('[data-id=template-no-result-'+type+']').html();
        } else {
          textResult = this.tabResult.find('[data-id=template-no-result-global]').html();
        }
        textResult = textResult.replace('{{TOTAL}}', '<strong>'+ total + '</strong>')
                                .replace('{{SEARCHTEXT}}', '<strong>'+ that.escapeXssCharacter(value) + '</strong>')
                                .replace('{{TYPE}}', textType);
        noResult.html(textResult);
      }
    },

    escapeXssCharacter: function(input) {
      return encodeURI(input).replace(/%20/g, ' ');
    },

    // render array item
    renderDataContent: function(response, type, start, end) {
      var that = this,
          opts = that.options,
          link = opts.customerLink + '?sgServicePortalCustomerId=',
          template = $(that.template.customer).html(),
          data, itemElem;
      if (type === that.vars.stringPolicy) {
        link = opts.policyLink + '?policyId=';
        template = $(that.template.policy).html();
      }
      template = template.replace(/{{SubmitRequest}}/g, opts.btnsubmitRequest)
                          .replace('{{SubmitClaim}}', opts.btnsubmitClaim)
                          .replace('{{CustomerDateText}}', opts.customerDateText)
                          .replace('{{PolicyOwnerText}}', opts.policyOwnerText)
                          .replace(/{{Link}}/g, link)
                          .replace('{{URLREDIRECTPAGE}}', that.element.data('url-redirect-page'))
                          .replace('{{URLSUBMITPOS}}', that.element.data('url-submit-pos'));
      data = that.getDataItem(response.data, start, end);
      itemElem = window.Handlebars.compile(template)(data);
      return itemElem;
    },

    // get array item
    getDataItem: function(response, start, end) {
      var data = [];
      $.each(response, function(index, item) {
        index >= start && index < end && data.push(item);
      });
      return data;
    },

    // action loadmore
    loadMoreContent: function(type) {
      var that = this,
          optsClass = that.options.class,
          response = that.vars.dataCustomer,
          blockContent = (type === that.vars.stringPolicy) ? that.contentPolicy : that.contentCustomer,
          blockResult = blockContent.find('.result-table'),
          btnShowMore = blockContent.find('[data-id=show-more]'),
          lengthChild = blockResult.children().length,
          itemElem;

      // render data
      type === that.vars.stringPolicy && (response = that.vars.dataPolicy);
      itemElem = that.renderDataContent(response, type, lengthChild, lengthChild + that.vars.size);
      blockResult.append(itemElem);
      // hide show more
      var isShowBtnShowMore = response.data.length > blockResult.children().length;
      isShowBtnShowMore && btnShowMore.removeClass(optsClass.hidden);
      !isShowBtnShowMore && btnShowMore.addClass(optsClass.hidden);
    },

    showLoading: function (countResult) {
      var optsClass = this.options.class;
      this.loading.removeClass(optsClass.hidden);
      countResult.addClass(optsClass.hidden);
    },

    hideLoading: function () {
      var optsClass = this.options.class;
      this.loading.addClass(optsClass.hidden);
      this.tabNav.removeClass(optsClass.hidden);
    },

    sendFormCustomer: function(obj) {
      var that = this,
          params = {
            customerId: obj.customerId,
            customerName: obj.customerName,
            customerGender: obj.customerGender
          };
      Site.ajaxUtil(
        that.options.urlSubmitPos,
        that.vars.method,
        'json',
        JSON.stringify(params),
        function(response) {
          if (response.statusCode === 200) {
            window.location.href = that.options.urlRedirectPage + '?sgServicePortalSubmitRef=' + response.submitRef;
          }
        },
        function(error) {
          throw error;
        }
      );
    },

    sendFormPolicy: function(obj) {
      var that = this,
          params = {
            customerId: obj.customerId,
            customerName: obj.customerName,
            customerGender: obj.customerGender,
            policyId: obj.policyId,
            sourceSystem: obj.sourceSystem
          };
      Site.ajaxUtil(
        that.options.urlSubmitPos,
        that.vars.method,
        'json',
        JSON.stringify(params),
        function(response) {
          if (response.statusCode === 200) {
            window.location.href = that.options.urlRedirectPage + '?sgServicePortalSubmitRef=' + response.submitRef;
          }
        },
        function(error) {
          throw error;
        }
      );
    },

    callAjaxFail: function(blockContent) {
      var optsClass = this.options.class;

      this.tabNav.removeClass(optsClass.hidden);
      blockContent.find('[data-id=count-result]').addClass(optsClass.hidden);
      blockContent.find('[data-id=notify-max-result]').addClass(optsClass.hidden);
      blockContent.find('[data-id=no-result]').addClass(optsClass.hidden);
      blockContent.find('[data-id=error-result]').removeClass(optsClass.hidden);

      this.loading.addClass(optsClass.hidden);
    },

    destroy: function() {
      $.removeData(this.element[0], pluginName);
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new Plugin(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {
    class: {
      active: 'active',
      hidden: 'hidden',
      open: 'open',
      resultTable: 'result-table'
    }
  };

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });

}(jQuery, window));

/**
 *  @name plugin
 *  @description description
 *  @version 1.0
 *  @options
 *    option
 *  @events
 *    event
 *  @methods
 *    init
 *    publicMethod
 *    destroy
 */
;(function($, window, undefined) {
  'use strict';

  var pluginName = 'sms-handle',
      resendOTP = true,
      resetCountingOTP,
      Site = window.Site,
      path = Site.vars.assetPath;

  var events = {
    click: 'click.' + pluginName
  };

  var createPopup = function(popupObj) {
    var button = popupObj.confirm ? '<button class="btn btn-default ' + popupObj.confirm.class + ' margin-left-xxs" type="button" data-toggle="modal" data-dismiss="modal" data-id="' + popupObj.confirm.id + '">' + popupObj.confirm.title + '</button>' : '',
      popup = Site.vars.bodyElem.find('[data-id=common-popup]');
      popup.html('<div class="modal-dialog partial-screen-modal-dialog"><div class="modal-content overflow-auto"><div class="modal-header bg-t2"><button class="modal-header-btn pull-left" data-dismiss="modal"><svg class="icon-xs hide-on-fallback" role="img" title="closewhite-glyph"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+ path +'icons/icons.svg#closewhite-glyph"></use><image class="icon-fallback" alt="closewhite-glyph" src="'+ path +'closewhite-glyph.png" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></image></svg>  </button><h6 class="w text-center">' + popupObj.title + '</h6></div><div class="modal-container padding-top-xxl content-centering"><p class="content-centering bt2">' + popupObj.description + '</p><div class="margin-bottom-l margin-top-xxl"><button class="btn btn-default ' + popupObj.decline.class + '" type="button" data-dismiss="modal" data-id="' + popupObj.decline.id + '">' + popupObj.decline.title + '</button>' + button + '</div></div></div></div>');
      popup.off('hidden.bs.modal').on('hidden.bs.modal', popupObj.decline.func);
      popupObj.confirm && Site.vars.bodyElem.off(events.click, '[data-id=' + popupObj.confirm.id + ']').on(events.click, '[data-id=' + popupObj.confirm.id + ']', popupObj.confirm.func);
      popup.modal('show');
  };

  function SmsHandle(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  SmsHandle.prototype = {
    init: function() {
      var that = this,
          opts = that.options,
          elem = that.element,
          onSubmitProcess = false,
          submitBtn = elem.find('button[type=submit]');

      that.countSubmit = 1;
      that.smsForm = elem;

      that.modalaiaOTP = elem.parents('[data-sms-popup]');

      that.smsForm.find('[name="device-id"]')
      .off('keyup')
      .on('keyup', function() {
        
        $(this).attr({
          'data-parsley-required':true,
          'data-parsley-group':'block-otp',
          'data-parsley-type':'number',
          'data-parsley-error-message':'Please enter a valid number.'
        });
        var deviceId = that.smsForm.find('[name="device-code"]').val() + '-' + $(this).val();
        that.smsForm.find('[name="device-id-full"]').val(deviceId);
      }); 

      that.smsForm.off('submit').on('submit', function(e) {
        e.preventDefault();

        if(onSubmitProcess) {
          return false;
        }

        onSubmitProcess = true;

        $(this).parsley().validate();

        var apiParams = {}, 
            smsOTP = opts.aiaOtpType || opts.onekeySMSType || opts.onekeySMSLinkType || false;

        if(opts.aiaOtpType) {
          apiParams = {
            customerId: opts.customerId,
            userId: opts.userId,
            userOtp: that.smsForm.find('input').val(),
            tokenUUID: that.tokenUUID,
            submitRef: opts.submitRef || ''
          };
        } else if(opts.onekeySMSType) {
          apiParams = {
            customerId: opts.customerId,
            serialNum: opts.serialNum,
            vendorId: opts.vendorId,
            challenge: that.challengeToken,
            otp: that.smsForm.find('input').val(),
            submitRef: opts.submitRef || ''
          };

        } else if(opts.onekeyHardwareType) {
          apiParams = {
            customerId: opts.customerId,
            serialNum: opts.serialNum,
            vendorId: opts.vendorId,
            otp: that.smsForm.find('input').val(),
            submitRef: opts.submitRef || '',
          };

        } else if(opts.onekeySMSLinkType) {
          apiParams = {
            customerId: opts.customerId,
            deviceId: that.smsForm.find('input[name=device-id-full]').val(),
            challenge: that.challengeToken,
            otp: that.smsForm.find('input[name=otp-code]').val()
          };
        } else if(opts.onekeyHardwareLinkType) {
          apiParams = {
            customerId: opts.customerId,
            deviceId: that.smsForm.find('input[name=device-id-full]').val(),
            otp: that.smsForm.find('input[name=otp-code]').val()
          };
        }

        if(that.smsForm.parsley().isValid()) {
          submitBtn.prop('disabled',true);

          var otpInfo = {
            type: 'token'
          };

          !opts.aiaOtpType && (otpInfo.deviceId = opts.deviceId);

          if(!opts.onekeyHardwareType) {
            otpInfo.phoneNo = opts.customerPhone;
            otpInfo.type = 'sms';
          }
          if(smsOTP && that.countSubmit >= opts.numberVerifyOtp) {
            return false;
          }
          
          Site.ajaxUtil(
            that.smsForm.data('verify-otp'),
            opts.method || 'POST',
            'json',
            JSON.stringify(apiParams),
            function(response) {
              elem.data('otp-token', that.smsForm.find('input').val());
              if(response.statusCode !== 200) {
                
                var message = response.data && 
                (response.data.detailMessage || response.data.detailMessage) || response.message;

                smsOTP && that.countSubmit++;

                if(response.statusCode === 7999 && 
                  (opts.onekeySMSLinkType || opts.onekeyHardwareLinkType)) {
                  onSubmitProcess = false;
                  typeof opts.verifyCallbackUnLinked === 'function' &&
                  opts.verifyCallbackUnLinked(response);
                  return false;
                }

                if(response.statusCode === 10401 && 
                  (opts.onekeySMSType || opts.onekeyHardwareType)) {
                  onSubmitProcess = false;

                  typeof opts.callBackGetLinked === 'function' &&
                  opts.callBackGetLinked(message);
                  return false;
                }
                
                if(smsOTP && that.countSubmit >= opts.numberVerifyOtp) {
                  message = 'The code entered is incorrect. As you have exceeded the maximum number of tries, OTP code is no longer possible. Please get a new OTP.';
                  submitBtn.attr('disabled', true);
                  onSubmitProcess = true;
                }
                message && that.smsForm.find('[data-id=verify-fail]').text(message);
                message && that.smsForm.find('[data-id=verify-fail]').removeClass('hidden');
                return false;
              }
              typeof opts.verifyCallback === 'function' &&
              opts.verifyCallback(otpInfo);

              // SEND TOKEN TO VERIFIED POPUP
              that.smsForm.find('input').val('');
              onSubmitProcess = false;
              (that.countSubmit < opts.numberVerifyOtp) &&
              submitBtn.attr('disabled', false);
            },
            function(error, jqXHR) {
              onSubmitProcess = false;
              var message = error.data && (error.data.detailMessage || error.data.message) || error.message;

              smsOTP && that.countSubmit++;

              if(error.statusCode === 7999 && 
                (opts.onekeySMSLinkType || opts.onekeyHardwareLinkType)) {
                typeof opts.verifyCallbackUnLinked === 'function' &&
                opts.verifyCallbackUnLinked(error);
                return false;
              }

              if(error.statusCode === 10401 && 
                (opts.onekeySMSType || opts.onekeyHardwareType)) {

                typeof opts.callBackGetLinked === 'function' &&
                opts.callBackGetLinked(message);
                return false;
              }

              if(jqXHR && jqXHR === 0) {
                that.smsForm.find('[data-id=verify-fail]').text('No connections are available. Plaese try again.');
                return false;
              }

              if(smsOTP && that.countSubmit >= (opts.numberVerifyOtp)) {
                message = 'The code entered is incorrect. As you have exceeded the maximum number of tries, OTP code is no longer possible. Please get a new OTP.';
                submitBtn.attr('disabled', true);
                onSubmitProcess = true;
              }

              message && that.smsForm.find('[data-id=verify-fail]').text(message);
              typeof opts.verifyErrorCallBack === 'function' && opts.verifyErrorCallBack(error);
              that.smsForm.find('[data-id=verify-fail]').removeClass('hidden');

              (that.countSubmit < opts.numberVerifyOtp) &&
              submitBtn.attr('disabled', false);
              onSubmitProcess = false;
              throw error;
            },
            opts.headerParams
          );
        } else {
          onSubmitProcess = false;
        }
      });

      that.smsForm.find('[data-id=resend-otp]')
      .off(events.click)
      .on(events.click, function(e) {
        e.preventDefault();

        var isMobile = $(this).parents('[data-is-mobile]').length,
            newSerialNum = that.smsForm.find('[name="device-id-full"]').val();

        if(!that.smsForm.parsley().validate({group:'device-id'})){
          return false;
        }

        if(isMobile) {
          window.sessionStorage.setItem('newSerialNum', newSerialNum);
          Site.vars.winElem.unbind('beforeunload.AIA');
          window.location.reload();
        } else {

          that.options.isRegenerate = true;
          that.options.newSerialNum = newSerialNum;
          that.options.isDesktop = true;
          that.handleGenerateOTP();

        }
     });
      // initialize
      // add events
    },

    handleGenerateOTP: function() {
      var that = this,
          opts = that.options,
          elem = that.element,
          apiParams = {},
          expiredTime = 5,
          onSubmitProcess = false,
          submitBtn = elem.find('button[type=submit]'),
          isHardwareType = opts.onekeyHardwareType || opts.onekeyHardwareLinkType,
          isMobile = that.smsForm.parents('[data-is-mobile]').length;

      if(onSubmitProcess) {
        return false;
      }

      that.countSubmit = 0;

      onSubmitProcess = true;
      submitBtn.prop('disabled',true);

      if(opts.aiaOtpType) {
        expiredTime = $('[data-aia-sms-expired]').data('aia-sms-expired');
        apiParams = {
          customerId: opts.customerId,
          userId: opts.userId,
          isRegenerate: opts.isRegenerate
        };

      } else if(opts.onekeySMSType) {

        expiredTime = $('[data-onekey-sms-expired]').data('onekey-sms-expired');
        apiParams = {
          customerId: opts.customerId,
          serialNum: opts.serialNum,
          vendorId: opts.vendorId,
          link: 'false'
        };
      } else if(isHardwareType) {
        expiredTime = $('[data-onekey-hardware-expired]').data('onekey-hardware-expired');
        
      } else if(opts.onekeySMSLinkType) {
        expiredTime = $('[data-onekey-sms-expired]').data('onekey-sms-expired');
        
        opts.isRegenerate && 
        opts.isDesktop &&
        opts.newSerialNum &&
        (opts.serialNum = opts.newSerialNum);

        if(isMobile) {
          window.sessionStorage.newSerialNum && 
          window.sessionStorage.newSerialNum !== 'undefined' &&
          window.sessionStorage.newSerialNum !== '' &&
          (opts.serialNum = window.sessionStorage.newSerialNum);
        }

        apiParams = {
          customerId: opts.customerId,
          serialNum: opts.serialNum,
          vendorId: opts.vendorId,
          link: true
        };
      }

      that.smsForm.find('[data-id=verify-fail]').addClass('hidden');
      that.smsForm.find('[data-id=expired-otp]').addClass('hidden');
      resendOTP = false;

      if(isHardwareType) {
        if(opts.onekeyHardwareLinkType) {
          if(opts.serialNum) {
            var arrayStrDevice = opts.serialNum.split('-');

            that.smsForm.find('[data-id=mobile-number] [name="device-code"]').val(arrayStrDevice[0]);
  
            that.smsForm.find('[data-id=mobile-number] [name="device-id"]').val(arrayStrDevice[1].replace(arrayStrDevice[1].slice(0,4), 'XXXX')).removeAttr('data-parsley-required data-parsley-group data-parsley-type ata-parsley-error-message');

            that.smsForm.find('[data-id=mobile-number] [name="device-id-full"]').val(opts.serialNum);

          } else {
            
            that.smsForm.find('[name=device-code]').removeClass('bg-b4').prop('disabled', false);

            that.smsForm.find('[name=device-code]').attr({
              'maxlength': '4',
              'placeholder': 'VA/VB',
              'data-parsley-required': 'true',
              'data-parsley-error-message': '',
              'data-parsley-group': 'device-id'
            });

            that.smsForm.find('[name=device-id]').attr({
              'data-parsley-required': 'true',
              'data-parsley-error-message': 'Please input device id.',
              'data-parsley-group': 'device-id'
            });
          }

        } else {
          var deviceIdText = opts.deviceId
                              .replace(opts.deviceId.slice(5,9), '-XXXX')
                              .replace(opts.deviceId.slice(opts.deviceId.length - 1, opts.deviceId.length), '-') + opts.deviceId[opts.deviceId.length-1];

          that.smsForm.find('[data-id=serial-number]').html('<strong>' + deviceIdText + '</strong>');
        }
        submitBtn.prop('disabled',false);
      }
      var errorPopupGenerateOTP = function(response) {
        var message = response.data && response.data.message || response.message;

        createPopup({
          title: 'Warning',
          description: message ,
          decline: {
            id: 'close',
            title: 'close',
            class: 'btn-secondary',
            func: function() {
              if($('body').find('[data-is-mobile]').length) {
                Site.vars.winElem.unbind('beforeunload.AIA');
                history.back();
              }
            }
          }
        });
        onSubmitProcess = false;
        submitBtn.prop('disabled',false);
      };

      var setSMSLinked = function(response) {
        var messageCode =  response.data && response.data.message && response.data.message.split('=') || '';
        if(isMobile) {
          $('.loading').addClass('hidden');
        }

        that.smsForm.find('input[name="challenge-code"]').val(messageCode[1] || '').attr('disabled', true).addClass('bg-b4');

        if(opts.serialNum) {
          var arrayStrDevice = opts.serialNum.split('-');

          that.smsForm.find('[data-id=mobile-number] [name="device-code"]').val(arrayStrDevice[0]);
  
          that.smsForm.find('[data-id=mobile-number] [name="device-id"]').val(arrayStrDevice[1].replace(arrayStrDevice[1].slice(0, 4), 'XXXX')).removeAttr('data-parsley-required data-parsley-group data-parsley-type ata-parsley-error-message');
  
          that.smsForm.find('[data-id=mobile-number] [name="device-id-full"]').val(opts.serialNum);
        } else {
          var message = response.data && response.data.message || response.message;
          createPopup({
            title: 'Warning',
            description: message + '</br>' + 'Please choose a device Id other.',
            decline: {
              id: 'close',
              title: 'close',
              class: 'btn-secondary',
              func: function() {
                that.smsForm.find('[data-id=mobile-number] [name="device-code"]').removeClass('bg-b4').prop('disabled', false);

                that.smsForm.find('[name=device-code]').attr({
                  'maxlength': '4',
                  'placeholder': 'VA/VB',
                  'data-parsley-required': 'true',
                  'data-parsley-error-message': '',
                  'data-parsley-group': 'device-id'
                });
      
                that.smsForm.find('[name=device-id]').attr({
                  'data-parsley-required': 'true',
                  'data-parsley-error-message': 'Please input device id.',
                  'data-parsley-group': 'device-id'
                });
              }
            }
          });
          
          
        }
      };

      !isHardwareType && Site.ajaxUtil(
        opts.api,
        opts.method || 'POST',
        'json',
        JSON.stringify(apiParams),
        function(response) {

          if(response.statusCode !== 200) {
            if(response.statusCode === 10401) {
              if(opts.onekeySMSLinkType) {
                setSMSLinked(response);
                onSubmitProcess = false;
                submitBtn.prop('disabled', false);
              } else {
                var message = response.data && response.data.message || response.message;
                typeof opts.callBackGetLinked === 'function' && opts.callBackGetLinked(message);
                return false;
              }
            } else {
              errorPopupGenerateOTP(response, opts.onekeySMSLinkType);
              return false;
            }
          }
          
          if(opts.onekeySMSType || opts.onekeySMSLinkType) {
            that.challengeToken = response.data.challengeToken;
          }

          typeof opts.generateCallback === 'function' && opts.generateCallback();
          
          if(opts.onekeySMSLinkType) {
            setSMSLinked(response);
          }

          if(opts.aiaOtpType || opts.onekeySMSType) {
            opts.customerPhone = response.data.customerPhone;
            that.smsForm.find('[data-id=mobile-number]').html('<strong>' + opts.customerPhone.replace(opts.customerPhone.slice(0, 4), 'XXXX') + '</strong>');
          }
          
          if(expiredTime) {
            that.countDown(expiredTime);
          }
          if(opts.aiaOtpType) {
            that.tokenUUID = response.data.tokenUUID || '';
          }
          onSubmitProcess = false;
          submitBtn.prop('disabled', false);
        },
        function(error) {
          if(opts.onekeySMSLinkType) {
            setSMSLinked(error);
            onSubmitProcess = false;
            submitBtn.prop('disabled', false);
            return false;
          }
          if(error.statusCode === 10401) {
            var message = error.data && error.data.message || error.message;
            typeof opts.callBackGetLinked === 'function' && opts.callBackGetLinked(message);
            return false;
          }
          errorPopupGenerateOTP(error);
        },
        opts.headerParams
      );
    },

    countDown: function(expiredTime) {
      var that = this;

      clearTimeout(resetCountingOTP);
      var countdown = function(time) {
        var seconds = 60,
            mins = time,
            validationOTP = that.smsForm.find('[data-id=validation-otp]').removeClass('hidden'),
            countOTP = validationOTP.find('[data-id=count-otp]').removeClass('u2'),
            validationExpired = that.smsForm.find('[data-id=expired-otp]').addClass('hidden'),
            tick = function() {
              var current_minutes = mins - 1;
              seconds--;
              if (current_minutes > 0) {
                countOTP.text(current_minutes.toString() + 'm' + (seconds < 10 ? '0' : '') + String(seconds) + 's');
              } else {
                countOTP.text((seconds < 10 ? '0' : '') + String(seconds) + 's');
              }
              if (seconds > 0) {
                seconds <= 5 && current_minutes <= 0 && !countOTP.hasClass('u2') && countOTP.addClass('u2');
                resetCountingOTP = setTimeout(tick, 1000);
              } else {
                if (mins > 1) {
                  countdown(mins - 1);
                } else {
                  validationExpired.removeClass('hidden');
                  validationOTP.addClass('hidden');
                }
              }
            };
        tick();
      };
      countdown(expiredTime);
      resendOTP = true;
    },

    destroy: function() {
      // remove events
      // deinitialize
      $.removeData(this.element[0], pluginName);
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new SmsHandle(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {
    expired: true,
    headerParams: 'undefined',
    numberVerifyOtp: 3
  };

  $(function() {
    // $('[data-' + pluginName + ']').on('customEvent', function() {
    //   // to do
    // });

    $('[data-' + pluginName + ']')[pluginName]({
      // key: 'custom'
    });
  });

}(jQuery, window));

;(function($, window, undefined) {
  'use strict';

  var pluginName = 'view-pdf';

  function Num(num) {
    var _num = num;
    return function () {
        return _num;
    };
  }
  function ViewPdf(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options);
    this.init();
  }

  ViewPdf.prototype = {
    init: function() {
      var that = this,
          pdfPath = that.element.data('pdf-path'),
          elemError = that.element.siblings('[data-id=no-result]'),
          isPad = $('html.ios') && window.innerWidth < 1025,
          _options = isPad ? {scale: 1.1} : {scale: 1.3};
          that.element.addClass('bg-b8').html('');

      pdfPath && 
      that.renderPDF(pdfPath, that.element, _options, function() {
        that.element.removeClass('bg-b8 pdf-view');
        elemError.removeClass('hidden');
      });
    },

    renderPDF: function(url, canvasContainer, _options, funcCBError) {
      var options = _options || { scale: 1.3 },          
          func,
          pdfDoc,
          promise = $.Deferred().resolve().promise(),         
          width, 
          height,
          makeRunner = function(func, args) {
            return function() {
              return func.call(null, args);
            };
          };
      function renderPage(num) {          
        var def = $.Deferred(),
            currPageNum = new Num(num);
        pdfDoc.getPage(currPageNum()).then(function(page) {
          var viewport = page.getViewport(options.scale);
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');
          var renderContext = {
            canvasContext: ctx,
            viewport: viewport
          };
          if(currPageNum() === 1) {                   
            height = viewport.height;
            width = viewport.width;
          }
          canvas.height = height;
          canvas.width = width;
          canvasContainer.append(canvas);
          page.render(renderContext).then(function() {
              def.resolve();
          });
        });
        return def.promise();
      }

      function renderPages(data) {
        pdfDoc = data;

        var pagesCount = pdfDoc.numPages;
        for (var i = 1; i <= pagesCount; i++) { 
          func = renderPage;
          promise = promise.then(makeRunner(func, i));
        }
      }
      window.PDFJS.disableWorker = true;
      window.PDFJS.getDocument(url).then(renderPages).catch(function(error){
        typeof funcCBError === 'function' && funcCBError();
        throw error;
      });           
    },
    destroy: function() {
      // remove events
      // deinitialize
      $.removeData(this.element[0], pluginName);
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        $.data(this, pluginName, new ViewPdf(this, options));
      } else if (instance[options]) {
        instance[options](params);
      }
    });
  };

  $.fn[pluginName].defaults = {
      pdfPath: ''
  };

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });

}(jQuery, window));
