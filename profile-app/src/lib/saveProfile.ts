import { rpc } from './auth';

export const buildParams = (profileData: Record<string, any>, email: string) => {
  const clean = (val: any) => {
    if (typeof val === 'string' && val.trim() === '') return null;
    if (Array.isArray(val) && val.length === 0) return null;
    return val ?? null;
  };

  const dealbreakers = Array.isArray(profileData.dealbreakers) ? [...profileData.dealbreakers] : [];
  if (profileData.dealbreakers_other && profileData.dealbreakers_other.trim() !== '') {
    dealbreakers.push(profileData.dealbreakers_other.trim());
  }
  const finalDealbreakers = dealbreakers.length > 0 ? dealbreakers : null;

  let ethnicity = clean(profileData.ethnicity);
  if (typeof ethnicity === 'string') ethnicity = [ethnicity];

  let max_distance = clean(profileData.max_distance);
  if (typeof max_distance === 'string') {
    const parsed = parseInt(max_distance, 10);
    max_distance = isNaN(parsed) ? null : parsed;
  }

  return {
    p_email: email,
    p_first_name: clean(profileData.first_name),
    p_last_name: clean(profileData.last_name),
    p_middle_name: null,
    p_phone: clean(profileData.phone),
    p_date_of_birth: clean(profileData.date_of_birth),
    p_gender: clean(profileData.gender),
    p_gender_identity: null,
    p_street_address: clean(profileData.street_address),
    p_city: clean(profileData.city),
    p_state: clean(profileData.state),
    p_postal_code: clean(profileData.postal_code),
    p_country: 'US',
    p_closest_major_city: clean(profileData.closest_major_city),
    p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    p_seeking: clean(profileData.seeking),
    p_share_with_matchmakers: profileData.share_with_matchmakers === true,
    p_interested_in_matchmaking: profileData.interested_in_matchmaking === true,
    p_email_opt_in: profileData.email_opt_in === true,
    p_services_text_opt_in: profileData.services_text_opt_in === true,
    p_marketing_text_opt_in: profileData.marketing_text_opt_in === true,
    p_bio: clean(profileData.bio),
    p_height_inches: clean(profileData.height_inches),
    p_body_type: clean(profileData.body_type),
    p_hair_color: clean(profileData.hair_color),
    p_eye_color: clean(profileData.eye_color),
    p_ethnicity: ethnicity,
    p_occupation: clean(profileData.occupation),
    p_employer: clean(profileData.employer),
    p_education: clean(profileData.education),
    p_university: clean(profileData.university),
    p_relationship_status: clean(profileData.relationship_status),
    p_kids: clean(profileData.kids),
    p_want_kids: clean(profileData.want_kids),
    p_pets: clean(profileData.pets),
    p_smoking: clean(profileData.smoking),
    p_drinking: clean(profileData.drinking),
    p_religion: clean(profileData.religion),
    p_politics: clean(profileData.politics),
    p_income_level: clean(profileData.income_level),
    p_activities_hobbies: clean(profileData.activities_hobbies),
    p_languages: clean(profileData.languages),
    p_ideal_match: clean(profileData.ideal_match),
    p_dealbreakers: finalDealbreakers,
    p_date_with_kids: clean(profileData.date_with_kids),
    p_relocation_in: clean(profileData.relocation_in),
    p_relocation_out: clean(profileData.relocation_out),
    p_min_age: clean(profileData.min_age),
    p_max_age: clean(profileData.max_age),
    p_max_distance: max_distance,
    p_preferred_height_min: clean(profileData.preferred_height_min),
    p_preferred_height_max: clean(profileData.preferred_height_max),
    p_preferred_body_type: clean(profileData.preferred_body_type),
    p_preferred_ethnicities: clean(profileData.preferred_ethnicities),
    p_preferred_religion: clean(profileData.preferred_religion),
    p_preferred_smoking: clean(profileData.preferred_smoking),
    p_preferred_alcohol: clean(profileData.preferred_alcohol),
    p_preferred_politics: clean(profileData.preferred_politics),
    p_preferred_education: clean(profileData.preferred_education),
    p_preferred_income: clean(profileData.preferred_income),
    p_preferred_relationship_status: clean(profileData.preferred_relationship_status),
  };
};

export const performSaveProfile = async (
  silent: boolean,
  profileData: Record<string, any>,
  email: string | null,
  isExistingUser: boolean,
  currentProfileId: string | null,
  orgSlug: string
): Promise<{ success: boolean; error?: string; id?: string }> => {
  if (!email) return { success: false, error: "Email is missing" };

  let min_age = profileData.min_age;
  if (typeof min_age === 'string') {
    const parsed = parseInt(min_age, 10);
    min_age = isNaN(parsed) ? null : parsed;
  }

  let max_age = profileData.max_age;
  if (typeof max_age === 'string') {
    const parsed = parseInt(max_age, 10);
    max_age = isNaN(parsed) ? null : parsed;
  }

  let height_inches = profileData.height_inches;
  if (typeof height_inches === 'string') {
    const parsed = parseInt(height_inches, 10);
    height_inches = isNaN(parsed) ? null : parsed;
  }

  const processedData: Record<string, any> = {
    ...profileData,
    min_age,
    max_age,
    height_inches
  };

  if (!silent) {
    const missing = [];
    let ageError = null;
    if (!processedData.first_name?.trim()) missing.push("First Name");
    if (!processedData.last_name?.trim()) missing.push("Last Name");
    
    if (!processedData.date_of_birth?.trim()) {
      missing.push("Date of Birth");
    } else {
      const dob = new Date(processedData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      if (dob > today) {
        ageError = "Please enter a valid date of birth.";
      } else if (age < 18) {
        ageError = "You must be at least 18 to create a profile.";
      } else if (age > 120) {
        ageError = "Please check your date of birth.";
      }
    }
    
    if (!processedData.gender?.trim()) missing.push("Gender");
    if (!processedData.city?.trim()) missing.push("City");
    if (!processedData.state?.trim()) missing.push("State");
    
    const zip = processedData.postal_code?.trim();
    if (!zip) missing.push("Postal Code");
    else if (!/^\d{5}$/.test(zip)) missing.push("Postal Code (must be 5 digits)");

    if (!processedData.seeking || processedData.seeking.length === 0) missing.push("Seeking (at least one option)");

    if (processedData.min_age !== null && processedData.max_age !== null && processedData.min_age > processedData.max_age) {
      missing.push("Minimum Age cannot exceed Maximum Age");
    }

    if (missing.length > 0 || ageError) {
      let errorMsg = "";
      if (missing.length > 0) {
        errorMsg = "Please complete the following required fields:\n- " + missing.join("\n- ");
      }
      if (ageError) {
        errorMsg = errorMsg ? errorMsg + "\n\n" + ageError : ageError;
      }
      return { success: false, error: errorMsg };
    }
  }

  const params = buildParams(processedData, email);

  try {
    let result;
    if (isExistingUser || currentProfileId) {
      result = await rpc('intake_update_profile', params);
    } else {
      try {
        result = await rpc('intake_create_profile', {
          ...params,
          p_organization_id: null,
          p_org_slug: orgSlug
        });
      } catch (createErr: any) {
        if (createErr?.status === 409 || createErr?.message?.includes('duplicate key') || createErr?.message?.includes('profiles_email_unique_idx')) {
          const existingProfile = await rpc('intake_load_profile', { p_email: email });
          if (existingProfile && existingProfile.id) {
            result = await rpc('intake_update_profile', params);
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
    }
    
    let returnedId = null;
    if (result && typeof result === 'object' && result.id) {
        returnedId = result.id;
    } else if (typeof result === 'string') {
        returnedId = result;
    } else if (typeof result === 'number') {
        returnedId = result.toString();
    }

    if (!returnedId) {
        return { success: false, error: "Save failed. No ID returned, possibly blocked by permissions." };
    }
    
    return { success: true, id: returnedId };
  } catch (err: any) {
    return { success: false, error: err.message || "An error occurred while saving." };
  }
};
