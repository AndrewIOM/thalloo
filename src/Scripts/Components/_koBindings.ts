///////////////////////////////
/// KnockoutJS Custom Bindings
///////////////////////////////

ko.bindingHandlers.slider = {
    init: function (element, valueAccessor, allBindingsAccesor, viewModel, bindingContext) {
        var model = viewModel;
        if (model.currentSlice() == null) return;
        noUiSlider.create(element, {
            start: [-9999, 9999],
            range: {
                'min': model.currentSlice().min,
                'max': model.currentSlice().max
            },
            connect: true,
            behaviour: 'tap-drag',
            step: 1,
        });
        ( < noUiSlider.Instance > element).noUiSlider.on('slide', function (values, handle) {
            var value = values[handle];
            if (handle) {
                model.currentSliceMax(value);

            } else {
                model.currentSliceMin(value);
            }
        });
    },
    update: function (element, valueAccessor, allBindingsAccesor, viewModel, bindingContext) {
        if (viewModel.currentSlice() == null) {
            let e = document.getElementById('slicer');
            if (e != null) e.setAttribute('disabled', "true");
        } else {
            if (element.innerHTML.length > 0) {
                updateSliderRange(Number(viewModel.currentSlice().min), Number(viewModel.currentSlice().max));
                let e = document.getElementById('slicer');
                if (e != null) e.removeAttribute('disabled');
            } else {
                createSlider(element, viewModel);
                let e = document.getElementById('slicer');
                if (e != null) e.removeAttribute('disabled');
            }
        }
    }
};

function createSlider(element, viewModel) {
    var model = viewModel;
    if (model.currentSlice() == null) return;
    noUiSlider.create(element, {
        start: [-9999, 9999],
        range: {
            'min': Number(model.currentSlice().min),
            'max': Number(model.currentSlice().max)
        },
        connect: true,
        behaviour: 'tap-drag',
        step: 1,
    });
    element.noUiSlider.on('slide', function (values, handle) {
        var value = values[handle];
        if (handle) {
            model.currentSliceMax(value);

        } else {
            model.currentSliceMin(value);
        }
    });
}

function updateSliderRange(min:number, max:number) {
    let e = < noUiSlider.Instance > document.getElementById('slicer');
    if (e != null) {
        e.noUiSlider.updateOptions(<any>{
            range: {
                'min': min,
                'max': max
            }
        });
    }
}

ko.bindingHandlers.truncatedText = {
    update: function (element, valueAccessor, allBindingsAccessor) {
        var originalText = ko.utils.unwrapObservable(valueAccessor()),
            length = ko.utils.unwrapObservable<string>(allBindingsAccessor().maxTextLength) || 20,
            truncatedText = originalText.length > length ? originalText.substring(0, length) : originalText;
            ko.bindingHandlers.text.update = element, () => { return truncatedText; }, <any>null, null, <any>null;
    }
};
