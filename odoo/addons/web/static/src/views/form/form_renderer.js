/** @odoo-module **/

import { Notebook } from "@web/core/notebook/notebook";
import { Field } from "@web/views/fields/field";
import { browser } from "@web/core/browser/browser";
import { useService } from "@web/core/utils/hooks";
import { useDebounced } from "@web/core/utils/timing";
import { ButtonBox } from "@web/views/form/button_box/button_box";
import { InnerGroup, OuterGroup } from "@web/views/form/form_group/form_group";
import { ViewButton } from "@web/views/view_button/view_button";
import { useViewCompiler } from "@web/views/view_compiler";
import { useBounceButton } from "@web/views/view_hook";
import { Widget } from "@web/views/widgets/widget";
import { evalDomain } from "../utils";
import { FormCompiler } from "./form_compiler";
import { FormLabel } from "./form_label";
import { StatusBarButtons } from "./status_bar_buttons/status_bar_buttons";

import { Component, onMounted, onWillUnmount, useEffect, useSubEnv, useRef, useState, xml } from "@odoo/owl";

export class FormRenderer extends Component {
    setup() {
        const { archInfo, Compiler, record } = this.props;
        const { arch, xmlDoc } = archInfo;
        const templates = { FormRenderer: xmlDoc };
        this.state = useState({}); // Used by Form Compiler
        this.templates = useViewCompiler(
            Compiler || FormCompiler,
            arch,
            templates,
            this.compileParams
        );
        useSubEnv({ model: record.model });
        useBounceButton(useRef("compiled_view_root"), (target) => {
            return !record.isInEdition && !!target.closest(".oe_title, .o_inner_group");
        });
        this.uiService = useService("ui");
        this.onResize = useDebounced(this.render, 200);
        onMounted(() => browser.addEventListener("resize", this.onResize));
        onWillUnmount(() => browser.removeEventListener("resize", this.onResize));

        const { autofocusFieldId } = archInfo;
        if (this.shouldAutoFocus) {
            const rootRef = useRef("compiled_view_root");
            useEffect(
                (isVirtual, rootEl) => {
                    if (!rootEl) {
                        return;
                    }
                    let elementToFocus;
                    if (isVirtual) {
                        const focusableSelectors = ['input[type="text"]', 'textarea', '[contenteditable]'];
                        elementToFocus =
                            (autofocusFieldId && rootEl.querySelector(`#${autofocusFieldId}`)) ||
                            rootEl.querySelector(focusableSelectors.map(sel => `.o_content .o_field_widget ${sel}`).join(', '));
                    }
                    if (elementToFocus) {
                        elementToFocus.focus();
                    }
                },
                () => [this.props.record.isVirtual, rootRef.el]
            );
        }
    }

    get shouldAutoFocus() {
        return !this.props.archInfo.disableAutofocus;
    }

    evalDomainFromRecord(record, expr) {
        return evalDomain(expr, record.evalContext);
    }

    get compileParams() {
        return {};
    }
}

FormRenderer.template = xml`<t t-call="{{ templates.FormRenderer }}" />`;
FormRenderer.components = {
    Field,
    FormLabel,
    ButtonBox,
    ViewButton,
    Widget,
    Notebook,
    OuterGroup,
    InnerGroup,
    StatusBarButtons,
};
FormRenderer.defaultProps = {
    activeNotebookPages: {},
    onNotebookPageChange: () => {},
};
