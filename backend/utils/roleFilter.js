exports.applyInventoryFilter = (baseQuery, conditions, params, user) => {
  const { role, user_id, region_id } = user;

  // ADMIN → no restriction
  if (role === "admin") {
    return { query: baseQuery, conditions, params };
  }

  // REGIONAL MANAGER → region filter
  if (role === "regional_manager") {
    baseQuery += `
      LEFT JOIN stores s 
        ON base.location_type = 'store' 
       AND base.location_id = s.store_id

      LEFT JOIN warehouses w 
        ON base.location_type = 'warehouse' 
       AND base.location_id = w.warehouse_id
    `;

    conditions.push(`
      (
        (base.location_type = 'store' AND s.region_id = ?)
        OR
        (base.location_type = 'warehouse' AND w.region_id = ?)
      )
    `);

    params.push(region_id, region_id);
  }

  // STORE MANAGER / SALESPERSON → assigned stores only
  if (role === "store_manager" || role === "salesperson") {
    baseQuery += `
      JOIN user_store_assignments usa 
        ON base.location_id = usa.location_id
    `;

    conditions.push("usa.user_id = ?");
    params.push(user_id);
  }

  return { query: baseQuery, conditions, params };
};