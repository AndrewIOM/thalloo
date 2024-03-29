///////////////////////////////
/// KnockoutJS Custom Bindings
///////////////////////////////

import * as ko from "knockout";
import * as noUiSlider from 'nouislider';

ko.bindingHandlers.slider = {
    init: function (element, _valueAccessor, _allBindingsAccesor, viewModel, _bindingContext) {
        if (viewModel.currentSlice() == null) return;
        noUiSlider.create(element, {
            start: [viewModel.currentSlice().Min, viewModel.currentSlice().Max],
            connect: true,
            range: {
                'min': viewModel.currentSlice().Min,
                'max': viewModel.currentSlice().Max
            },
            behaviour: 'tap-drag',
            step: 1,
        });
        (<noUiSlider.Instance> element).noUiSlider.on('slide', function (values, handle) {
            var value = values[handle];
            if (handle) {
                viewModel.currentSliceMax(value);
            } else {
                viewModel.currentSliceMin(value);
            }
        });
    },
    update: function (element, _valueAccessor, _allBindingsAccesor, viewModel, _bindingContext) {
        if (viewModel.currentSlice() == null) {
            let e = document.getElementById('slicer');
            if (e != null) e.setAttribute('disabled', "true");
        } else {
            if (element.innerHTML.length > 0) {
                updateSliderRange(viewModel.currentSlice().Min, viewModel.currentSlice().Max);
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
    if (viewModel.currentSlice() == null) return;
    noUiSlider.create(element, {
        start: [viewModel.currentSlice().Min, viewModel.currentSlice().Max],
        range: {
            'min': Number(viewModel.currentSlice().Min),
            'max': Number(viewModel.currentSlice().Max)
        },
        connect: true,
        behaviour: 'tap-drag',
        step: 1,
    });
    element.noUiSlider.on('slide', function (values, handle) {
        var value = Number(values[Number(handle)]);
        if (handle) {
            viewModel.currentSliceMax(value);

        } else {
            viewModel.currentSliceMin(value);
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
        e.noUiSlider.set([min, max]);
    }
}

ko.bindingHandlers.truncatedText = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        let originalText = ko.utils.unwrapObservable(valueAccessor());
        let length = ko.utils.unwrapObservable<string>(allBindingsAccessor().maxTextLength) || 20
        let truncatedText = originalText.length > length ? originalText.substring(0, length) : originalText;
        if (ko.bindingHandlers.text.update != null) {
            ko.bindingHandlers.text.update(element, () => { return truncatedText; }, allBindingsAccessor, viewModel, bindingContext); 
        }
    }
};
