import {getDataFromToken} from "@/helpers/getDataFromToken";
import {NextRequest, NextResponse} from "next/server";
import User from "@/models/userModel";
import {connect} from "@/dbConfig/dbConfig";

connect();

export async function GET(request: NextRequest) {
    try {
        const userId = await getDataFromToken(request);
        const user = await User.findOne({_id: userId}).select("isAdmin");
        return NextResponse.json({
            message: "User found, see the data object to see if the user is admin",
            success: true,
            data: user,
        });
    } catch (error: any) {
        return NextResponse.json({error: error.message}, {status: 400});
    }
}
