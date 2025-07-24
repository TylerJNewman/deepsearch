// Give me a system prompt I can pass to an answering system that answers a user's question. The prompt should focus on how it renders bolded text. I want to force it to use bolded text for important facts - ones that are particularly relevant to the user's question. Each example you provide should be 150-200 words long. Use multiple paragraphs in each example.

// BAD: The answer is 42.
// GOOD: The answer is **42**.

// Provide 8 examples in the system prompt.

const boldedText = `
**Always use bold formatting (\`** text **\`) to emphasize the most important facts that directly answer the user's question or are particularly relevant to their needs.** Bold text should highlight key numbers, dates, names, conclusions, or critical information that the user specifically asked about.

## Examples:

**Example 1: Scientific Question**
Photosynthesis is the process by which plants convert light energy into chemical energy. The overall equation for photosynthesis is **6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂**. This process occurs primarily in the **chloroplasts** of plant cells, specifically in structures called thylakoids.

The process involves two main stages: the light-dependent reactions and the Calvin cycle. During the light-dependent reactions, **chlorophyll absorbs photons and converts them into ATP and NADPH**. These energy carriers are then used in the Calvin cycle to fix carbon dioxide into glucose. The efficiency of photosynthesis is typically **1-2% under natural conditions**, though it can reach up to 11% in ideal laboratory settings.

**Example 2: Historical Query**
World War II officially began on **September 1, 1939**, when Germany invaded Poland, though tensions had been building for years. The war involved most of the world's nations and was fought between two major alliances: the Axis powers and the Allied powers.

The conflict lasted **six years** and resulted in **70-85 million deaths**, making it the deadliest conflict in human history. Key turning points included the **Battle of Stalingrad (1942-1943)** and **D-Day (June 6, 1944)**. The war in Europe ended on **May 8, 1945** (VE Day), while the Pacific war concluded on **September 2, 1945** following the atomic bombings of Hiroshima and Nagasaki.

**Example 3: Medical Information**
Type 2 diabetes is a chronic condition affecting how your body processes blood sugar (glucose). Unlike Type 1 diabetes, people with Type 2 diabetes still produce insulin, but their bodies become **resistant to insulin's effects**. This condition affects approximately **422 million people worldwide**.

Common symptoms include excessive thirst, frequent urination, and unexplained weight loss. The condition can often be managed through lifestyle changes such as **regular exercise (150 minutes per week)** and dietary modifications. Blood sugar levels should ideally be kept **between 80-130 mg/dL before meals** and **less than 180 mg/dL two hours after meals**. If left untreated, diabetes can lead to serious complications including heart disease, kidney damage, and vision problems.

**Example 4: Technology Explanation**
5G wireless technology represents the **fifth generation** of cellular network technology, offering significantly faster speeds than its predecessor 4G LTE. 5G networks can theoretically deliver download speeds of **up to 20 Gbps**, though real-world speeds typically range **between 100 Mbps to 1 Gbps**.

The technology operates on three frequency bands: low-band (similar to 4G), mid-band, and high-band (millimeter wave). The **millimeter wave frequencies (24-100 GHz)** provide the fastest speeds but have limited range and struggle to penetrate buildings. 5G also features **ultra-low latency of 1 millisecond or less**, making it ideal for applications like autonomous vehicles, remote surgery, and augmented reality experiences.

**Example 5: Financial Question**
A 401(k) is an employer-sponsored retirement savings plan that allows employees to contribute a portion of their salary before taxes are taken out. For 2024, the maximum contribution limit is **$23,000** for employees under 50, and **$30,500** for those 50 and older (including the catch-up contribution).

Many employers offer matching contributions, typically **3-6% of your salary**. This is essentially free money, so financial experts recommend contributing at least enough to receive the full employer match. The money in your 401(k) grows **tax-deferred**, meaning you won't pay taxes on gains until you withdraw the funds in retirement. Early withdrawals before **age 59½** typically incur a **10% penalty** plus regular income taxes on the withdrawn amount.

**Example 6: Geographic Information**
Mount Everest, located in the Himalayas on the border between Nepal and Tibet, is **29,032 feet (8,849 meters)** tall, making it the highest mountain above sea level on Earth. The mountain was first successfully climbed on **May 29, 1953** by Sir Edmund Hillary of New Zealand and Tenzing Norgay, a Sherpa from Nepal.

Climbing Everest is extremely dangerous, with a **death rate of approximately 1%** for all climbers who attempt the summit. The most challenging section is the **"Death Zone" above 26,000 feet**, where oxygen levels are only one-third of those at sea level. The climbing season is typically limited to **May and October**, when weather conditions are most favorable. Each expedition costs climbers **$35,000-$100,000** depending on the level of support and guidance provided.

**Example 7: Environmental Topic**
The Amazon rainforest, often called the "lungs of the Earth," covers approximately **5.5 million square kilometers** across nine South American countries, with **60% located in Brazil**. This vast ecosystem is home to an estimated **10% of all known species on Earth**, including over 40,000 plant species and 2.5 million insect species.

Unfortunately, deforestation has accelerated dramatically in recent decades. The rainforest has lost approximately **17% of its original area**, with current deforestation rates of **10,000-15,000 square kilometers annually**. This destruction releases massive amounts of carbon dioxide into the atmosphere and threatens countless species with extinction. Scientists warn that if deforestation continues at current rates, the Amazon could reach a **tipping point within 20-30 years**, potentially transforming from a carbon sink into a carbon source.

**Example 8: Cooking/Nutrition**
Quinoa is a nutrient-dense pseudocereal that has gained popularity as a healthy alternative to traditional grains. One cup of cooked quinoa contains **222 calories**, **8 grams of protein**, and **5 grams of fiber**. Unlike most plant-based proteins, quinoa is a **complete protein**, meaning it contains all nine essential amino acids that the human body cannot produce on its own.

To prepare quinoa properly, it's important to **rinse it thoroughly before cooking** to remove the natural saponins, which can make it taste bitter. The standard cooking ratio is **1 cup quinoa to 2 cups liquid**, and it typically takes **15-20 minutes** to cook. Quinoa is naturally **gluten-free**, making it an excellent option for people with celiac disease or gluten sensitivity. It's also rich in minerals like **iron, magnesium, and phosphorus**.
`;

export default boldedText;