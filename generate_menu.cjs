const menu = `
1. FAMILIAR
Cebiche de pescado — S/100
Arroz c/ mariscos — S/100
Cebiche mixto — S/120
Chaufa de mariscos — S/100
2. TRÍOS
Cebiche / arroz con mariscos / chicharrón de pota — S/29
Cebiche / chaufa de mariscos / chicharrón de pota — S/29
Cebiche / arroz con mariscos / chicharrón de pescado — S/29
Cebiche / chaufa de mariscos / chicharrón de pescado — S/29
Combina tu trío (todo vale) — S/45
3. SOPAS
Chilcano especial — S/12
Acebichado / cangrejo / choro / chicharrón de pota
Parihuela cabrilla — S/28
Parihuela de pescado (filete) — S/28
Sudado cabrilla — S/28
Sudado de pescado (filete) — S/28
Chupe de pescado — S/26
Chupe de camarones — S/32
4. ARROCES
Arroz con mariscos — S/27
Chaufa de mariscos — S/25
Chaufa de pescado — S/26
Aeropuerto marino — S/26
Arroz c/ langostino — S/36
5. TACU TACU
Tacu tacu en salsa de mariscos — S/26
Tacu tacu c/ filete en salsa a lo macho — S/35
Tacu tacu c/ saltado de pescado — S/27
Tacu tacu c/ lomo saltado — S/30
Tacu tacu c/ saltado de pollo — S/28
6. PESCADO
(Entero o filete)
Pescado frito cabrilla — S/25
Pescado frito doncella — S/18
Pescado a lo macho — S/28
Filete de pescado en salsa de ajo — S/26
Escabeche de pescado filete — S/26
Filete de pescado a la chorrilana — S/26
Filete de pescado a la plancha c/ ensalada mixta — S/26
Trucha frita c/ yuca frita y salsa criolla — S/26
7. CHICHARRONES Y JALEAS
Chicharrón de pota completa — S/20
Chicharrón de pescado completo — S/34
Chicharrón de calamar — S/35
Jalea mixta — S/45
Jalea norteña + pescado entero — S/55
8. ANTOJITOS NIGHT
Alitas búfalo (6 piezas) — S/22
Alitas BBQ (6 piezas) — S/22
Alitas acebichadas — S/25
Trío de alitas: búfalo + BBQ + acebichada — S/49
9. DIETÉTICO
Ensalada mixta c/ palta — S/16
Ensalada suprema — S/19
10. COMPLEMENTOS
Camote glaseado — S/5
Chifles — S/5
Choclo — S/5
Yuca frita — S/5
Plátanos frito — S/5
Yuyo frito — S/5
Huevo frito — S/3
Papa frita — S/8
Porción de tortillas de choclo (6 und.) — S/12
11. SÁBADOS, DOMINGOS Y FERIADOS
1/4 de arroz c/ pato + huancaina — S/30
1/4 de arroz c/ pato + cebiche — S/40
Seco de cordero / frijoles / yuca — S/26
1/2 cuy dorado — S/40
Tallarines verdes con bisteck — S/30
Malaya dorada c/ papa dorada — S/22
12. PARRILLAS
Lomo saltado — S/26
Saltado de pollo — S/24
Tallarín saltado de pollo o carne — S/25
Tallarín a la huancaina c/ lomo saltado — S/32
Spaguetti c/ langostinos — S/26
Milanesa de pollo — S/18
Bisteck a lo pobre — S/28
Churrasco a la parrilla — S/30
Pollo a la plancha c/ papas fritas + ensalada mixta — S/25
Lomo chaufa — S/28
13. SALTADOS AL WOK
Chaufa de pollo o aeropuerto — S/17
Chaufa de la selva + plátano frito y ají de cocona — S/24
14. PIQUEOS
Tamalito verde (c/ salsa criolla) — S/14
Conchitas a la parmesana (6 und.) — S/28
Choros a la chalaca (6 und.) — S/20
Pulpo al olivo — S/32
Pulpo a la parrilla — S/38
3 tortillas de choclo c/ cevichito — S/20
Pan c/ pejerrey — S/12
Tequeños / queso y guacamole 6 unidades — S/12
Tequeños / queso y guacamole 12 unidades — S/24
15. CAUSAS
Causa de atún — S/13
Causa acebichada — S/18
Causa pulpa de cangrejo — S/26
Causa de langostinos — S/26
Causa pulpo al olivo — S/26
16. CEBICHES
Cebiche de pescado — S/28
Cebiche mixto — S/30
Cebiche de pota/pescado — S/22
Cebiche de conchas (12 und.) — S/45
Cebiche purita pota — S/20
Cebiche clásico — S/38
Cebiche de pescado y 6 und. conchas negras — S/35
17. LECHE DE TIGRE
Leche de tigre de pescado + chicharrón de pota — S/15
Leche de pantera + chicharrón de pota — S/19
Leche de tigre mixta + chicharrón de pota — S/21
Leche de tigre Paradero 104 — S/26
18. TIRADITO
Tiradito clásico — S/25
19. PIQUEO MARINO
Ronda 1° — S/55
Ronda 2° — S/65
Chicharrón de pota c/ chaufa de mariscos — S/26
Chicharrón de pota c/ arroz con mariscos — S/26
Chicharrón de pescado c/ arroz con mariscos — S/28
Chicharrón de pescado c/ chaufa de mariscos — S/28
Combina tu dúo — S/35
`;

const lines = menu.split('\n').map(l => l.trim()).filter(l => l);
let currentCategory = 'General';
const products = [];

for (const line of lines) {
  if (line.match(/^\d+\.\s/)) {
    currentCategory = line.replace(/^\d+\.\s/, '').trim();
    currentCategory = currentCategory.charAt(0) + currentCategory.slice(1).toLowerCase();
  } else if (line.includes('— S/')) {
    const [nameRaw, priceRaw] = line.split('— S/');
    const name = nameRaw.trim();
    const price = parseFloat(priceRaw.trim());
    if (name && !isNaN(price)) {
      products.push({ name, price, category: currentCategory });
    }
  }
}

const sql = `
-- Script para insertar la Carta Fija de Paradero 104
-- Ejecutar en el Editor SQL de Supabase

INSERT INTO products (id, name, price, category, tenant_id) VALUES
${products.map(p => `(gen_random_uuid(), '${p.name.replace(/'/g, "''")}', ${p.price}, '${p.category}', 'paradero')`).join(',\n')};
`;

const fs = require('fs');
fs.writeFileSync('paradero_104_menu.sql', sql.trim());
console.log("SQL script generated successfully.");
