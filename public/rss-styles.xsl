<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> RSS Feed</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            background: #1e1e1e;
            color: #d4d4d4;
            font-family: 'Consolas', 'Fira Code', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.8;
            padding: 1.5rem 2rem;
          }

          .xml-line { display: block; white-space: pre; }
          .xml-line:hover { background: #2a2a2a; }

          .tag    { color: #569cd6; }
          .attr   { color: #9cdcfe; }
          .val    { color: #ce9178; }
          .text   { color: #d4d4d4; }
          .cdata  { color: #6a9955; }
          .punct  { color: #808080; }
          .decl   { color: #569cd6; }

          .i0  { padding-left: 0; }
          .i1  { padding-left: 2ch; }
          .i2  { padding-left: 4ch; }
          .i3  { padding-left: 6ch; }
          .i4  { padding-left: 8ch; }
          .i5  { padding-left: 10ch; }

          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: #1e1e1e; }
          ::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
        </style>
      </head>
      <body>

        <!-- XML Declaration -->
        <span class="xml-line i0"><span class="decl">&lt;?xml version="1.0" encoding="utf-8"?&gt;</span></span>
        <span class="xml-line i0"><span class="tag">&lt;rss</span> <span class="attr">version</span><span class="punct">="</span><span class="val">2.0</span><span class="punct">"</span> <span class="attr">xmlns:dc</span><span class="punct">="</span><span class="val">http://purl.org/dc/elements/1.1/</span><span class="punct">"</span> <span class="attr">xmlns:content</span><span class="punct">="</span><span class="val">http://purl.org/rss/1.0/modules/content/</span><span class="punct">"</span><span class="tag">&gt;</span></span>

        <span class="xml-line i1"><span class="tag">&lt;channel&gt;</span></span>

        <span class="xml-line i2"><span class="tag">&lt;title&gt;</span><span class="text"><xsl:value-of select="/rss/channel/title"/></span><span class="tag">&lt;/title&gt;</span></span>
        <span class="xml-line i2"><span class="tag">&lt;link&gt;</span><span class="text"><xsl:value-of select="/rss/channel/link"/></span><span class="tag">&lt;/link&gt;</span></span>
        <span class="xml-line i2"><span class="tag">&lt;description&gt;</span><span class="text"><xsl:value-of select="/rss/channel/description"/></span><span class="tag">&lt;/description&gt;</span></span>
        <span class="xml-line i2"><span class="tag">&lt;lastBuildDate&gt;</span><span class="text"><xsl:value-of select="/rss/channel/lastBuildDate"/></span><span class="tag">&lt;/lastBuildDate&gt;</span></span>
        <span class="xml-line i2"><span class="tag">&lt;docs&gt;</span><span class="text"><xsl:value-of select="/rss/channel/docs"/></span><span class="tag">&lt;/docs&gt;</span></span>
        <span class="xml-line i2"><span class="tag">&lt;generator&gt;</span><span class="text"><xsl:value-of select="/rss/channel/generator"/></span><span class="tag">&lt;/generator&gt;</span></span>
        <span class="xml-line i2"><span class="tag">&lt;language&gt;</span><span class="text"><xsl:value-of select="/rss/channel/language"/></span><span class="tag">&lt;/language&gt;</span></span>

        <span class="xml-line i2"><span class="tag">&lt;image&gt;</span></span>
        <span class="xml-line i3"><span class="tag">&lt;title&gt;</span><span class="text"><xsl:value-of select="/rss/channel/image/title"/></span><span class="tag">&lt;/title&gt;</span></span>
        <span class="xml-line i3"><span class="tag">&lt;url&gt;</span><span class="text"><xsl:value-of select="/rss/channel/image/url"/></span><span class="tag">&lt;/url&gt;</span></span>
        <span class="xml-line i3"><span class="tag">&lt;link&gt;</span><span class="text"><xsl:value-of select="/rss/channel/image/link"/></span><span class="tag">&lt;/link&gt;</span></span>
        <span class="xml-line i2"><span class="tag">&lt;/image&gt;</span></span>

        <span class="xml-line i2"><span class="tag">&lt;copyright&gt;</span><span class="text"><xsl:value-of select="/rss/channel/copyright"/></span><span class="tag">&lt;/copyright&gt;</span></span>

        <xsl:for-each select="/rss/channel/item">
          <span class="xml-line i2"><span class="tag">&lt;item&gt;</span></span>
          <span class="xml-line i3"><span class="tag">&lt;title&gt;</span><span class="cdata">&lt;![CDATA[<xsl:value-of select="title"/>]]&gt;</span><span class="tag">&lt;/title&gt;</span></span>
          <span class="xml-line i3"><span class="tag">&lt;link&gt;</span><span class="text"><xsl:value-of select="link"/></span><span class="tag">&lt;/link&gt;</span></span>
          <span class="xml-line i3"><span class="tag">&lt;guid</span> <span class="attr">isPermaLink</span><span class="punct">="</span><span class="val">false</span><span class="punct">"</span><span class="tag">&gt;</span><span class="text"><xsl:value-of select="guid"/></span><span class="tag">&lt;/guid&gt;</span></span>
          <span class="xml-line i3"><span class="tag">&lt;pubDate&gt;</span><span class="text"><xsl:value-of select="pubDate"/></span><span class="tag">&lt;/pubDate&gt;</span></span>
          <span class="xml-line i3"><span class="tag">&lt;description&gt;</span><span class="cdata">&lt;![CDATA[<xsl:value-of select="description"/>]]&gt;</span><span class="tag">&lt;/description&gt;</span></span>
          <span class="xml-line i3"><span class="tag">&lt;content:encoded&gt;</span><span class="cdata">&lt;![CDATA[<xsl:value-of select="description"/> Visit page: <xsl:value-of select="link"/>]]&gt;</span><span class="tag">&lt;/content:encoded&gt;</span></span>
          <span class="xml-line i3"><span class="tag">&lt;author&gt;</span><span class="text"><xsl:value-of select="author"/></span><span class="tag">&lt;/author&gt;</span></span>
          <xsl:for-each select="category">
            <span class="xml-line i3"><span class="tag">&lt;category&gt;</span><span class="text"><xsl:value-of select="."/></span><span class="tag">&lt;/category&gt;</span></span>
          </xsl:for-each>
          <span class="xml-line i2"><span class="tag">&lt;/item&gt;</span></span>
        </xsl:for-each>

        <span class="xml-line i1"><span class="tag">&lt;/channel&gt;</span></span>
        <span class="xml-line i0"><span class="tag">&lt;/rss&gt;</span></span>

      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>