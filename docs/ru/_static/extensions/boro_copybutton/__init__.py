"""A small project-local copy button extension without third-party JS."""


def setup(app):
    app.add_config_value('boro_copybutton_version', '1.0.3', 'env')

    app.add_js_file('extensions/boro_copybutton/copybutton.js')
    app.add_css_file('extensions/boro_copybutton/copybutton.css')

    return {
        'version': '1.0.3',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }