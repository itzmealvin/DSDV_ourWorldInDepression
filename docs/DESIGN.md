# Design direction

A historical mental-health atlas for students and curious readers. The map is the visual centerpiece; explanatory text and controls stay quiet and readable.

Palette: Mist #F3F7FA, White #FFFFFF, Ink #172D46, Slate #526579, Teal #087F82, Lavender #E7E8F6.

Small teal text uses the darker #066568 variant to meet contrast requirements on mist and lavender surfaces.

Typography: self-hosted Source Sans 3, 400/600/700. Fluid 42–68px headlines, 16–18px body, maximum 68-character reading measure, tabular numerals for comparisons. Sentence case throughout.

Left-aligned layout:

```text
Brand                           Global / Vietnam / Survey
Title + explanation                       Historical period
Measure / country / year
[             World map              ][ Country + trend ]
[ Legend + geographic coverage                          ]
[ Data table / CSV download                              ]
[ Source notes and limitations                           ]
```

On mobile, controls wrap and the country panel follows the map. Chart data has a table equivalent. Navigation uses links; controls use visible labels and native select elements. No autoplay or ornamental animation.

The UI/UX search suggested cyberpunk and then generic wellness layouts. Neither suits this project. Keep readable type and keyboard access; reject neon, embossed controls and conversion sections. The geographic atlas is the single large visual gesture.

Architecture follows the user's final preference: plain, checked-in HTML/CSS/JavaScript in public/, local D3 and fonts, no framework, bundler or Cloudflare CLI. An optional Python maintenance script regenerates anonymous JSON if source data changes. It is not needed to run or deploy the website.
