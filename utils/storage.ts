import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

/**
 * Upload an image from a local URI to Supabase Storage
 * @param uri Local file URI from ImagePicker
 * @param bucket Storage bucket name
 * @param path Path within the bucket (e.g., 'profiles/user123.jpg')
 * @returns Public URL of the uploaded image or null if failed
 */
export const uploadImage = async (uri: string, bucket: string, path: string): Promise<string | null> => {
    try {
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });

        // Convert base64 to ArrayBuffer
        const arrayBuffer = decode(base64);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, arrayBuffer, {
                contentType: 'image/jpeg', // Standard for picked images usually
                upsert: true,
            });

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    } catch (e) {
        console.error('Storage upload failed', e);
        return null;
    }
};
