///////////////////////////////
/// KnockoutJS Custom Bindings
///////////////////////////////

import * as ko from "knockout";
import * as noUiSlider from 'nouislider';

ko.bindingHandlers.slider = {
    init: function (element, valueAccessor, allBindingsAccesor, viewModel, bindingContext) {
        if (viewModel.currentSlice() == null) return;
        noUiSlider.create(element, {
            start: [-9999, 9999],
            range: {
                'min': viewModel.currentSlice().Min,
                'max': viewModel.currentSlice().Max
            },
            connect: true,
            behaviour: 'tap-drag',
            step: 1,
        });
        ( < noUiSlider.Instance > element).noUiSlider.on('slide', function (values, handle) {
            var value = values[handle];
            console.log(value);
            console.log(handle);
            if (handle) {
                viewModel.currentSliceMax(value);
            } else {
                viewModel.currentSliceMin(value);
            }
        });
    },
    update: function (element, valueAccessor, allBindingsAccesor, viewModel, bindingContext) {
        if (viewModel.currentSlice() == null) {
            let e = document.getElementById('slicer');
            if (e != null) e.setAttribute('disabled', "true");
        } else {
            console.log(viewModel.currentSlice().Min + " - " + viewModel.currentSlice().Max);
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
        start: [-9999, 9999],
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
        console.log(value);
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
    }
}

ko.bindingHandlers.truncatedText = {
    update: function (element, valueAccessor, allBindingsAccessor) {
        let originalText = ko.utils.unwrapObservable(valueAccessor());
        let length = ko.utils.unwrapObservable<string>(allBindingsAccessor().maxTextLength) || 20
        let truncatedText = originalText.length > length ? originalText.substring(0, length) : originalText;
        ko.bindingHandlers.text.update = element, () => { return truncatedText; }, <any>null, null, <any>null;
    }
};
