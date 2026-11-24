"""Project-local thumbnail directive backed by Lightbox2."""

from html import escape
from uuid import uuid4

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective


class ThumbnailNode(nodes.image):
    """An image rendered as a Lightbox link in HTML output."""


class ThumbnailDirective(SphinxDirective):
    """Render an image thumbnail that opens the original in Lightbox2."""

    required_arguments = 1
    optional_arguments = 0
    final_argument_whitespace = True
    has_content = True

    option_spec = {
        'alt': directives.unchanged,
        'align': lambda value: directives.choice(value, ('left', 'center', 'right')),
        'class': directives.class_option,
        'height': directives.length_or_unitless,
        'title': directives.unchanged,
        'width': directives.length_or_percentage_or_unitless,
    }

    def run(self):
        uri = self.arguments[0].strip()
        if not uri:
            raise self.error('thumbnail directive requires an image path')

        caption = '\n'.join(self.content).strip()
        title = self.options.get('title', caption)
        classes = list(self.options.get('class', []))
        align = self.options.get('align', '')
        if align:
            classes.append('align-' + align)

        node = ThumbnailNode(uri=uri, alt=self.options.get('alt', ''))
        node['classes'] = classes
        node['width'] = self.options.get('width', '100%')
        node['height'] = self.options.get('height', 'auto')
        node['scale'] = 100
        node['thumbnail_title'] = title
        node['lightbox_group'] = 'thumbnail-' + uuid4().hex
        self.set_source_info(node)
        self.add_name(node)

        return [node]


def _image_uri(translator, node):
    """Return the output-relative URI for an image node."""
    uri = node['uri']
    builder = translator.builder
    if uri in builder.images:
        return '/'.join((builder.imgpath, builder.images[uri]))
    return uri


def visit_thumbnail_html(translator, node):
    uri = escape(_image_uri(translator, node), quote=True)
    title = escape(node.get('thumbnail_title', ''), quote=True)
    alt = escape(node.get('alt', ''), quote=True)
    group = escape(node.get('lightbox_group', 'thumbnail'), quote=True)
    classes = escape(' '.join(node.get('classes', [])), quote=True)
    width = escape(str(node.get('width', '100%')), quote=True)
    height = escape(str(node.get('height', 'auto')), quote=True)
    node_id = escape(node.get('ids', [''])[0], quote=True) if node.get('ids') else ''
    id_attribute = ' id="{}"'.format(node_id) if node_id else ''

    translator.body.append(
        '<a{} class="{}" data-lightbox="{}" data-title="{}" data-alt="{}" '
        'href="{}" title="{}">'
        '<img src="{}" class="{}" width="{}" height="{}" alt="{}" />'
        '</a>'.format(
            id_attribute, classes, group, title, alt, uri, title, uri,
            classes, width, height, alt,
        )
    )


def depart_thumbnail_html(translator, node):
    pass


def _visit_image(translator, node):
    translator.visit_image(node)


def _depart_image(translator, node):
    translator.depart_image(node)


def setup(app):
    app.add_config_value('boro_thumbnail_version', '1.0.4', 'env')
    app.add_directive('thumbnail', ThumbnailDirective)

    app.add_node(
        ThumbnailNode,
        html=(visit_thumbnail_html, depart_thumbnail_html),
        latex=(_visit_image, _depart_image),
        text=(_visit_image, _depart_image),
        man=(_visit_image, _depart_image),
        texinfo=(_visit_image, _depart_image),
        epub=(_visit_image, _depart_image),
    )

    app.add_css_file('extensions/boro-lightbox/lightbox.min.css')
    app.add_js_file('extensions/boro-lightbox/lightbox.min.js')
    app.add_js_file('extensions/boro-lightbox/options.js')

    return {
        'version': '1.0.4',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }