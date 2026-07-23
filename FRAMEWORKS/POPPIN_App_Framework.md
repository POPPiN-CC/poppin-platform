# POPPIN app framework

## Intro

This is a pilot website for an app that creates a new way of interacting with the Privately Owned Public Spaces (POPS) in NYC. The app covers three main features:

- A standard map viewer; with the location of POPS, the information related to them, and search and filter tools. This allows users to add information, called 'Civic Intelligence' about the current lived experience of the space

- Live activity; allows users to create an invitation for people to join them in an activity.

- 3D Space; developer submitted 3d scans of the POPS, which allows outsiders to explore the POPS, and insiders to add media and memories to the 3D Space

## Part 1: The design basics (audit all pages to match visual consistency)

### Colors

| Name                         | Hex code  | Where it's used                                                                            |
|------------------------------|-----------|--------------------------------------------------------------------------------------------|
| App green                    | `#1FBF6B` | The logo, the header search button, generic buttons that aren't tied to one specific space |
| Liveliness scale, quiet end  | `#0EA5A0` | Cool teal-green, for very quiet spaces                                                     |
| Liveliness scale, mid        | `#7FBF3F` | Yellow-green, balanced spaces                                                              |
| Liveliness scale, lively end | `#E8763D` | Warm amber, lively/bustling spaces                                                         |
| Text, dark                   | `#1A1A1A` | Headlines, names                                                                           |
| Text, muted                  | `#8A8A82` | Subtitles, secondary info                                                                  |
| Background                   | `#FAFAF8` | The app's main background, warm off-white, never pure white                                |
| Line/border                  | `#EEEEEE` | Card borders, dividers                                                                     |
| Panel/tag background         | `#F1F0EC` | Neutral tag chips, amenity backgrounds                                                     |

**Dynamic Coloring**: each space is given a color determined by data. It's always calculated from real data (how quiet or lively people say it is). This will be reflected in the map icons for the spaces. Green is the only color that's "hardcoded," and it's reserved for the app itself, not any specific place.

### Fonts

| Font                                  | Used for                                                                                      | Never used for                                 |
|---------------------------------------|-----------------------------------------------------------------------------------------------|------------------------------------------------|
| Grandstander (bold, rounded, playful) | Headlines, space names, buttons, section labels                                               | Long paragraphs, data numbers                  |
| Varela Round                          | Everyday body text, descriptions, form fields, list items                                     | Headlines                                      |
| Reenie Beanie (hand-written script)   | Only two things: the tagline under the logo, and a space's one-line "personality" description | Anything functional, buttons, data, navigation |

### The logo

- The word "POPPIN," in Grandstander, bold
- The dot over the "i" is replaced by a small balloon icon in assets/vectors
- That balloon dot has a small continuous bounce animation on the welcome screen

### The Window

This site emulates a phone app, so every page should have the same app portrait aspect ratio. Use White letterbox crops to achieve this.

## Part 2: The Data stored for each POPS (POPS Profile Data)

Basic info, geolocation, and Amenities will be drawn from the Assets\Data\Privately_Owned_Public_Spaces.csv

### Geolocation

From longitude and latitude of POPS. In the case of the three pilot site, the centroids of the geojson polygons

### Basic Info

Building_Name (if not included, use building address), Building_Address, Hour_Of_Access, Public_Space_Type

### Photo

For now, developer submitted, maybe later it is scraped and stored.

### Amenities

Amenities_Required and Permitted_Amenities

### Activities

Activities are in the broad categories: Work and Focus, Arts and Culture, Social and Group, Food and Leisure, Community and Civic, Sports and Games, Nature and Animals, Just Being There. Activities are in these categories, but can be more specifically logged by users

### Liveliness

A scale on the range for quiet to lively. This is based on a composite of the crowdedness of the space (the idea is through noise sensors this is approximated) and the amount of activity and engagement logged in a space through this platform.

### Media

User submitted photos, emojis, videos, audio recordings, and sticky notes; all tied to the 3d space model

### Civic Intelligence

User submitted responses to the space

- "What are you up to?" Lets users add the activities that will be tied to that space

- Slider inputs under the heading "Add your read of the space!"

  - Safe to Unsafe

  - Open Seating to Couldn't Find a Spot

  - Welcoming to Unwelcome

- "What would make this better?" question with a short text response box for the user

### 3D Space

Developer submitted 3d scans of the POPS that allow users to enter and explore.

## Part 3: Live activity

This feature allows users to start an activity and create an invitation for others to Join. This activity can only start once you are inside a POPS. Users can define the activity and timeframe the invitation is open. This will affect the icon of that particular POPS on the map. These activities are logged to the POPS profile

## Part 4: 3D Space

Refer to FRAMEWORKS\POPPiN_3D space.md. Only 3 POPS will have a scan. For the others, there will be a "3D space coming soon!"

## Part 5: Every screen

### Screen 1: Welcome

Shown on loading the site.

**What's on it, top to bottom:**

- Faint hand-sketched background drawings: a smiling sun, two trees, a small fountain, a person walking a dog, a person about to throw a frisbee (all drawn in a single thin gray-brown line, no color, just texture)
- The logo (large size)
- The tagline, in the script font: "what's poppin in your neighborhood?"
- One line of body text: "Find your perfect spot to read, work, hang, or just vibe, right now." (the word "vibe" is colored in App Green)
- One button: "Let's go"

### Screen 2: Discover (the main/home screen)

What you land on right after welcome.

**Top bar:**

- Small logo (top left)
- A search icon in a green-outlined box (top right), tapping it opens a search field. It searches POPS by: POPS name, map location
- A filter toggle that opens a filter menu for three categories: Distance, Liveliness, Actvities.
  - Distance from user by: 5-minute walk (0.4 miles), 10-minute walk (0.8 miles), 15-minute walk (1.5miles)
  - Liveliness is based off the number of peoples in the POPS and the number of activities logged there recently.
  - Activities are in the broad categories: Work and Focus, Arts and Culture, Social and Group, Food and Leisure, Community and Civic, Sports and Games, Nature and Animals, Just Being There.

**The map:**

- A real, zoomable street map of the whole city. Use https://api.maptiler.com/maps/topo-v4/?key=vtjgKwXzB0PXf3QnsdSn#15.1/40.75202/-73.96056
- The map will be the full screen of the app
- A handful of pins, these are the real, active spaces (currently just the 3 Cornell Tech pilot spots)
- The other real POPS pins, that are not part of the pilot but will show up as normal like the rest
- The colors of the pins is based on the Liveliness scale of each POPS

**Below that, a list:**

- A pullable list tucked away at the base of the screen, with a handle to pull up (reference is google maps phone interface)
- By default, this will show you the 5 closest POPS
- This will show the results of the search or filters
- For each POPS in the list, it displays under the name: ammenity icons, recent activities

**What happens when you tap things:**

- Tap a POPS from the list, opens that space's profile (Screen 3)
- Tap a pin on the map, opens a small text frame with the POPS name and a photo on the map next to the pin. Tapping off the map will make this disappear. Tapping this text window will take you to the POPS profile (screen 3)

### Screen 3: A space's profile

What you see after tapping into one specific POPS.

**Top**

A header photo of the POPS (currently a placeholder gray box, needs real photos) with a back button and a heart (favorite) buttons overlayed in the top corners.

- A photo at the top (currently a placeholder gray box, needs real photos)

- Written directly on the photo, in the script font: the space's one-line personality description, like "the quiet reader's corner"

**Main**

Above the contents, below the header, is the POPS name in Grandstander

This screen has two tabs below the name: 'What's Happening' and 'The Space'. Next to the tabs, there will be two circular icon buttons: 'Look Inside', and 'Live Activity'

**Tab 1: What's Happening** (this is the one people land on by default)

1.  Activities Here. These are the activities that are tied to each POPS. This can be displayed in a grid of rounded the boxes with the names of submitted activities.

- Activities are in the broad categories: Work and Focus, Arts and Culture, Social and Group, Food and Leisure, Community and Civic, Sports and Games, Nature and Animals, Just Being There.

- These categories have an associated emoji and color of the text box, but the activities themselves are more specifically stated.

- A "What are you up?" to button on the same line of the "Activities Here" title, will open a submission box for the a user to type in an activity and choose from the categories.

2.  Three sliders, each showing a gradient bar from one end to the other:

    - Safe to Unsafe

    - Open Seating to Couldn't Find a Spot

    - Welcoming to Unwelcome

> On each slider: a small white dot shows what everyone else has said on average.

- A "Add your read of the space!" button toggles the sliders to a submission state, where a dark-ringed circle is yours to drag, wherever you drag it (or tap) becomes your rating.

- In the submission state, a "What would make this better?" question with a short optional text response box for the user appears.

- One button at the bottom: "Submit my read" will close the submission state and upload response, changing the averages for the sliders for that POPS

**Tab 2: The space**

- Building_Address; Hour_Of_Access; Amenities_Required & Permitted_Amenities (grouped together, no distinction)(icons plus words, like "seating," "wifi," "shade")

- Two buttons under "Share your spot": "Add a photo" and "Add a recording"

- A scrolling gallery of photos and submitted media

**Button 1: Look Inside**

- Circle button, icon to be specified

- Takes you to the 3D space page

**Button 2: Live Activity**

- Circle button, icon to be specified

- Takes you to the Live activity page

### Screen 4: Live Activity

**What's on it:**

- Two big options to choose from:
  - "Pick an icon" (a fast option, shows a grid of 12 small icons to choose from: music, frisbee/spikeball, pizza, sunset, chess, books, a dog, art, yoga, a soccer ball, a camera, a microphone)
  - "Snap a photo" (upload a real photo instead of picking an icon)
- A text field for the activity's name (e.g. "UNO night")
- A text field for a short message, written casually, like texting a friend
- A dropdown for how long it lasts: 15 minutes, 30 minutes, 1 hour, or 2 hours
- A button: "Post it"

After posting, a small pulsing green pin appears on the map at that spot.

Tapping a live pin opens a card showing: the icon or photo, the activity name, a countdown of minutes left, the message, how many people have said they're in, and a button: "I'm in"

### Screen 5: 3D Space

- Users enter the 3D space. Refer to FRAMEWORKS\POPPiN_3D space.md
- Style and design guide still applies

## Part 6: Data for the pilot

1.  This is a proof of concept app, and has not been running collecting data from users. All we have currently is from the Assets\Data\Privately_Owned_Public_Spaces.csv. As such, we will need to generate the required data so that this displays in the app as intended. This includes, the Activities, civic intelligence, etc. We must determine the best way to do this

2.  For the working version, we will have three self made additional POPS that we are adding. These are:

- Cornell Tech: Queensboro View

- Cornell Tech: Squirrel Grove

- Cornell Tech: Tata Green

> These are the only spaces that have a 3D scan.

## How to use this document

Treat this as the source of truth for "what should this look like and say." If you or I change a color, a piece of copy, or add a screen, update this file in the same sitting, don't let it drift out of date.
